import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Principal "mo:core/Principal";
import Authorization "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";

actor {
  // IDs
  var nextGameId = 0;
  var nextRegistrationId = 0;
  var nextQuestionId = 0;

  // Types
  public type Question = {
    id : Nat;
    questionText : Text;
    fieldType : Text;
    required : Bool;
  };

  public type Answer = {
    questionId : Nat;
    answer : Text;
  };

  public type GameTile = {
    id : Nat;
    title : Text;
    platform : Text;
    bannerUrl : Text;
    entryFee : Nat;
    isOpen : Bool;
    description : Text;
    questions : [Question];
  };

  // V1 type kept for stable variable migration
  type RegistrationV1 = {
    id : Nat;
    gameId : Nat;
    playerName : Text;
    uid : Text;
    inGameName : Text;
    answers : [Answer];
    paymentStatus : Text;
    createdAt : Time.Time;
    owner : Principal;
  };

  public type Registration = {
    id : Nat;
    gameId : Nat;
    playerName : Text;
    uid : Text;
    inGameName : Text;
    answers : [Answer];
    paymentStatus : Text;
    createdAt : Time.Time;
    owner : Principal;
    paymentScreenshotUrl : ?Text;
  };

  public type UserProfile = {
    name : Text;
  };

  // Authorization
  let accessControlState = Authorization.initState();
  include MixinAuthorization(accessControlState);

  // State
  let gameTiles = Map.empty<Nat, GameTile>();
  // Legacy stable var — receives old data on upgrade (no paymentScreenshotUrl field)
  let registrations = Map.empty<Nat, RegistrationV1>();
  // New stable var — used for all reads/writes going forward
  let registrationsV2 = Map.empty<Nat, Registration>();
  let globalQuestions = Map.empty<Nat, Question>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  var stripeConfig : ?Stripe.StripeConfiguration = null;
  var migrationDone = false;

  // Migrate V1 records into V2 on first upgrade
  system func postupgrade() {
    if (not migrationDone) {
      for ((k, v) in registrations.entries()) {
        let migrated : Registration = {
          id = v.id;
          gameId = v.gameId;
          playerName = v.playerName;
          uid = v.uid;
          inGameName = v.inGameName;
          answers = v.answers;
          paymentStatus = v.paymentStatus;
          createdAt = v.createdAt;
          owner = v.owner;
          paymentScreenshotUrl = null;
        };
        registrationsV2.add(k, migrated);
        if (v.id + 1 > nextRegistrationId) {
          nextRegistrationId := v.id + 1;
        };
      };
      migrationDone := true;
    };
  };

  // User Profile Management
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not Authorization.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Game Management (Admin)
  public shared ({ caller }) func createGame(game : GameTile) : async Nat {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create games");
    };
    let newGame : GameTile = {
      game with
      id = nextGameId;
    };
    gameTiles.add(nextGameId, newGame);
    nextGameId += 1;
    newGame.id;
  };

  public shared ({ caller }) func updateGame(game : GameTile) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update games");
    };
    if (not gameTiles.containsKey(game.id)) {
      Runtime.trap("Game not found");
    };
    gameTiles.add(game.id, game);
  };

  public shared ({ caller }) func deleteGame(gameId : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete games");
    };
    if (not gameTiles.containsKey(gameId)) {
      Runtime.trap("Game not found");
    };
    gameTiles.remove(gameId);
  };

  // Game Queries (Public)
  public query func listOpenGames() : async [GameTile] {
    gameTiles.values().toArray().filter(func(g) { g.isOpen });
  };

  public query func getGame(gameId : Nat) : async GameTile {
    switch (gameTiles.get(gameId)) {
      case (null) { Runtime.trap("Game not found") };
      case (?game) { game };
    };
  };

  // Registration
  public shared ({ caller }) func submitRegistration(reg : Registration) : async Nat {
    let newReg : Registration = {
      reg with
      id = nextRegistrationId;
      createdAt = Time.now();
      paymentStatus = "pending";
      owner = caller;
    };
    registrationsV2.add(nextRegistrationId, newReg);
    nextRegistrationId += 1;
    newReg.id;
  };

  public query ({ caller }) func getRegistration(regId : Nat) : async Registration {
    switch (registrationsV2.get(regId)) {
      case (null) { Runtime.trap("Registration not found") };
      case (?reg) {
        if (caller != reg.owner and not Authorization.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own registrations");
        };
        reg;
      };
    };
  };

  public query ({ caller }) func getCallerRegistrations() : async [Registration] {
    if (not (Authorization.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their registrations");
    };
    registrationsV2.values().toArray().filter(func(r) { r.owner == caller });
  };

  public query ({ caller }) func getGameRegistrations(gameId : Nat) : async [Registration] {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list registrations per game");
    };
    registrationsV2.values().toArray().filter(func(r) { r.gameId == gameId });
  };

  public shared ({ caller }) func updatePaymentStatus(regId : Nat, status : Text) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update payment status");
    };
    switch (registrationsV2.get(regId)) {
      case (null) { Runtime.trap("Registration not found") };
      case (?reg) {
        let updatedReg : Registration = {
          reg with
          paymentStatus = status;
        };
        registrationsV2.add(regId, updatedReg);
      };
    };
  };

  // Question Management (Admin)
  public shared ({ caller }) func createQuestion(question : Question) : async Nat {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create questions");
    };
    let newQuestion : Question = {
      question with
      id = nextQuestionId;
    };
    globalQuestions.add(nextQuestionId, newQuestion);
    nextQuestionId += 1;
    newQuestion.id;
  };

  public shared ({ caller }) func updateQuestion(question : Question) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update questions");
    };
    if (not globalQuestions.containsKey(question.id)) {
      Runtime.trap("Question not found");
    };
    globalQuestions.add(question.id, question);
  };

  public shared ({ caller }) func deleteQuestion(qid : Nat) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete questions");
    };
    if (not globalQuestions.containsKey(qid)) {
      Runtime.trap("Question not found");
    };
    globalQuestions.remove(qid);
  };

  public query func getQuestions() : async [Question] {
    globalQuestions.values().toArray();
  };

  public query func getQuestion(qid : Nat) : async Question {
    switch (globalQuestions.get(qid)) {
      case (null) { Runtime.trap("Question not found") };
      case (?q) { q };
    };
  };

  // Stripe Payment Integration
  public query func isStripeConfigured() : async Bool {
    switch (stripeConfig) {
      case (null) { false };
      case (_) { true };
    };
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (Authorization.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    stripeConfig := ?config;
  };

  func getStripeConfigurationInternal() : Stripe.StripeConfiguration {
    switch (stripeConfig) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfigurationInternal(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    await Stripe.createCheckoutSession(getStripeConfigurationInternal(), caller, items, successUrl, cancelUrl, transform);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };
};
