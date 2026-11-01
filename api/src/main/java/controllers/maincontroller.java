package controllers;

import java.io.IOException;
//import java.lang.System.Logger;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;
import java.util.Properties;

import javax.inject.Singleton;
import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.DELETE;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.NewCookie;
import javax.ws.rs.core.Response;

import org.json.JSONException;
import org.json.JSONObject;
import org.json.XML;

import com.fasterxml.jackson.core.JsonFactory;
import com.fasterxml.jackson.core.JsonParseException;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;

import Model.APIErrorModel;
import Model.ContestInfoResponse;
import Model.ContestStateResponse;
import Model.LoginPage;
import Model.LoginResponse;
import Model.LogoutResponse;
import Model.ScoreboardRowDTO;
import Model.SessionResponse;
import Model.getWebsocketPathResponse;
import Model.languageList;
import Model.listProblems;
import edu.csus.ecs.pc2.api.IClient;
import edu.csus.ecs.pc2.api.IClient.ClientType;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.ServerConnection;
import edu.csus.ecs.pc2.api.exceptions.LoginFailureException;
import edu.csus.ecs.pc2.api.exceptions.NotLoggedInException;
import edu.csus.ecs.pc2.core.exception.IllegalContestState;
import edu.csus.ecs.pc2.core.model.IInternalContest;
import edu.csus.ecs.pc2.core.model.Run;
import edu.csus.ecs.pc2.core.scoring.DefaultScoringAlgorithm;
import exceptions.ApiException;
import exceptions.ContestNullException;
import exceptions.NoCookieException;
import exceptions.NotRunningException;
import exceptions.NotVerifiedCookieException;
import exceptions.PC2ServiceUnavailableException;
import exceptions.UnauthorizedSessionException;
import helpers.CSRF_Token_Handler;
import helpers.CookiesHandlers;
import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.parameters.RequestBody;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.servers.Server;
import io.swagger.v3.oas.annotations.tags.Tag;
import services.ScoreboardUpdates;
import standingutil.StandingObjModel;
import web1.ServerINI;
import websocket.ContestSocket;

@Path("/main")
@Singleton
@Tag(name = "Main", description = "Main controller endpoints")
@OpenAPIDefinition(
	    servers = {
	        @Server(url = "/api", description = "API base path")
	    }
	)
public class maincontroller extends GlobalClass {

   /* public static Map<String, ServerConnection> sessions =
        new ConcurrentHashMap<>();

    protected static Map<String, Integer> loginAttempts =
        new ConcurrentHashMap<>();

    protected static Map<String, Long> lockoutTime =
        new ConcurrentHashMap<>();
        
        */

    private static final int MAX_ATTEMPTS = 5;
    private static final long LOCK_TIME =
        5 * 60 * 1000;
    
    //Create a default scoreboard accounts
    public static final String DEFAULT_PC2_SCOREBOARD_ACCOUNT = "scoreboard2";
    public static final String DEFAULT_PC2_SCOREBOARD_PASSWORD = "scoreboard2";
    
    //Boolean indicates where to get the new scoreboard or use the cached one
    //Initialize it to true to enforce gettings the standings at 1st client (browser) request
    protected static Boolean scoreboardCacheInvalidate = true;
    
    //Scoreboard special server connection
    private static ServerConnection scoreboardServerConn = null;
    
    
    //The scoring algorithm used
    protected static DefaultScoringAlgorithm dsa;
    
    //Flag to sync the standings updates, to ensure only one client request updates the standings
    protected static Boolean standingsMutex = false;
    
    //The cache used to store the current standings
    protected static String JSONStandingsCache;
    private static StandingObjModel JSONStandingsCacheObj;
    private static ObjectMapper objectMapper = new ObjectMapper();
        
    public maincontroller() throws URISyntaxException, LoginFailureException, NotLoggedInException  {
    	super();
    	//Invalidate the scoreboard cache to enforce updating the scoreboard
    	maincontroller.scoreboardCacheInvalidate = true;
    	
    	//Create a PC2 server connection with scoreboard account
    	scoreboardServerConn = new ServerConnection();

        //get the credentials to be used to login to the PC2 server, either those given in the WTI pc2v9.ini file or the defaults defined above
        String sbAccount = ServerINI.createServerINI().getScoreboardAccount();
        if (sbAccount==null || sbAccount.equals("")) {
                sbAccount = DEFAULT_PC2_SCOREBOARD_ACCOUNT;
        }
        String sbPassword = ServerINI.createServerINI().getScoreboardPassword();
        if (sbPassword==null || sbPassword.equals("")) {
                sbPassword = DEFAULT_PC2_SCOREBOARD_PASSWORD;
        }
        
        
        System.out.println("Using scoreboard account " + sbAccount);
        
      //login to the PC2 server
        try {
        		System.out.println("Logging with scoreboard.......");
                scoreboardServerConn.login(sbAccount, sbPassword);
        } catch (LoginFailureException e) {
                //Note: theoretically this should never happen, because the WebServer.startServer() method verifies that the scoreboard
                // account can be successfully logged in before ever starting the Jetty server -- so theoretically we can't get here.
                // Theroretically.
                System.out.println("WTI Login failed for scoreboard account '" + sbAccount + "': " + e.getMessage());
                throw new RuntimeException("WTI login failed for PC2 scoreboard account '" + sbAccount + "': " + e.getMessage()) ;
        }
        
        
        //Create a DefaultScoringAlgorithm used to compute standings
        dsa = new DefaultScoringAlgorithm();
        
        //Freeze the standings in case of freeze period (Blind hour)
        dsa.setObeyFreeze(true);
        
        //Create a scoreboard listener

        try {
        	//ScoreboardChangeListener sbListener = new ScoreboardChangeListener(this, client);
        	//Modify to add the websocket
        	ScoreboardUpdates sbListener = new ScoreboardUpdates(this);
        	scoreboardServerConn.getContest().addRunListener(sbListener);
			scoreboardServerConn.getContest().addContestConfigurationUpdateListener(sbListener);
			
			
        } catch (NotLoggedInException e) {
			//Cannot get here (theoretically) since a login failure should already have thrown a RuntimeException in the above static block.
			//Theoretically.
			logger.severe("Scoreboard not logged in to PC2 server in ContestController constructor -- should not be possible! " + e.getMessage());
			e.printStackTrace();
			throw e;
		} catch (JSONException e) {
			logger.throwing(this.getClass().getName(), "getJSONStandings()", e);
		}
    }
    
    public static String getContestTeamRank(String teamName) {
    	/*
    	 * HEre, i want to parse the JSONStandingsCache and return back the rank of the team teamName
    	 */
    	System.out.println("String = "+ JSONStandingsCache);
    	
      	
    	return JSONStandingsCache;
    }
    
    
    /*
     * 	Websocket url path
     */
        @Operation(
        	    summary = "Get contest web socket URL path",
        	    description = "Returns the current contest web socket URL path consumed by both frontend and backend."
        	)
        	@ApiResponses({
        	    @ApiResponse(
        	        responseCode = "200",
        	        description = "Contest websocket URL path returned successfully",
        	        content = @Content(
        	            mediaType = "application/json",
        	            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
        	                schema = @Schema(
        	                    implementation = getWebsocketPathResponse.class
        	                )
        	            )
        	        )
        	    ),        	 
        	    @ApiResponse(
            	        responseCode = "401",
            	        description = "Unauthorized"
            	    ),
        	    @ApiResponse(
        	        responseCode = "503",
        	        description = "Global PC2 contest data unavailable"
        	    ),
        	    @ApiResponse(
        	        responseCode = "500",
        	        description = "Unexpected internal server error"
        	    )
        	})
        @GET
        @Path("/getwspath")
        @Produces(MediaType.APPLICATION_JSON)
        public Response getContestwspath(
            @Context HttpServletRequest req
        ) {
        	
                //Be sure that only one client (browser) updates the standings
                 try {
                	 String wspath = ServerINI.getSocketPath();
               	 
	            	 return Response.ok().entity(new getWebsocketPathResponse(wspath)).type(MediaType.APPLICATION_JSON).build();
                	 
                 } catch ( ContestNullException e) {
                	 
                	 return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(
    	     					new ApiException(Response.Status.INTERNAL_SERVER_ERROR,e.getMessage()))
    	     					.type(MediaType.APPLICATION_JSON).build();
                	 
                 } catch (JSONException e) {
        			
        			logger.throwing(this.getClass().getName(), "getJSONStandings()", e);
    				return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
    						.entity(new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR,
    								"IOException (JsonProcessingException?) in ContestController.getJSONStandings()"))
    						.type(MediaType.APPLICATION_JSON).build();    				
    			}
        }

        
//--------------------------------------------------------------------    
    
    /*
     * 	Contest Info
     */
        @Operation(
        	    summary = "Get contest info",
        	    description = "Returns the current contest info."
        	)
        	@ApiResponses({
        	    @ApiResponse(
        	        responseCode = "200",
        	        description = "Contest info returned successfully",
        	        content = @Content(
        	            mediaType = "application/json",
        	            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
        	                schema = @Schema(
        	                    implementation = ContestInfoResponse.class
        	                )
        	            )
        	        )
        	    ),        	 
        	    @ApiResponse(
            	        responseCode = "401",
            	        description = "Unauthorized, no connected scoreboard"
            	    ),
        	    @ApiResponse(
        	        responseCode = "503",
        	        description = "Global PC2 contest data unavailable"
        	    ),
        	    @ApiResponse(
        	        responseCode = "500",
        	        description = "Unexpected internal server error"
        	    )
        	})
        @GET
        @Path("/contestinfo")
        @Produces(MediaType.APPLICATION_JSON)
        public Response getContestInfo(
            @Context HttpServletRequest req
        ) {
        	
        	
        		if ( scoreboardServerConn == null ) {
        			return Response.status(Response.Status.UNAUTHORIZED)
         					.entity(new APIErrorModel(Response.Status.UNAUTHORIZED,"No connected scoreboardr"))
         					.type(MediaType.APPLICATION_JSON).build();
        		}
        	
					

        	
                        
                 
                //Be sure that only one client (browser) updates the standings
                 try {
                	 String ContestTitle = scoreboardServerConn.getContest().getContestTitle();
                	 
               	 
	            	 return Response.ok().entity(new ContestInfoResponse(ContestTitle)).type(MediaType.APPLICATION_JSON).build();
                	 
                 } catch ( ContestNullException e) {
                	 
                	 return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(
    	     					new ApiException(Response.Status.INTERNAL_SERVER_ERROR,e.getMessage()))
    	     					.type(MediaType.APPLICATION_JSON).build();
                	 
                 }catch (NotLoggedInException e1) {			//There is no scoreboard account logged in!!!
                	 
         			return Response.status(Response.Status.UNAUTHORIZED).entity(
        					new APIErrorModel(Response.Status.UNAUTHORIZED, "Unauthorized user request - not logged in"))
        					.type(MediaType.APPLICATION_JSON).build();
         			
        		} catch (JSONException e) {
        			
        			logger.throwing(this.getClass().getName(), "getJSONStandings()", e);
    				return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
    						.entity(new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR,
    								"IOException (JsonProcessingException?) in ContestController.getJSONStandings()"))
    						.type(MediaType.APPLICATION_JSON).build();
    				
    			}

        }

        
        
        
//---------------------------------------------------        
        
/*
 * 	Scoreboard
 */
    @Operation(
    	    summary = "Get global contest scoreboard",
    	    description = "Returns the current global contest standings calculated from all PC2 teams and judged runs."
    	)
    	@ApiResponses({
    	    @ApiResponse(
    	        responseCode = "200",
    	        description = "Scoreboard standings retrieved successfully",
    	        content = @Content(
    	            mediaType = "application/json",
    	            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
    	                schema = @Schema(
    	                    implementation = ScoreboardRowDTO.class
    	                )
    	            )
    	        )
    	    ),
    	    @ApiResponse(
    	        responseCode = "401",
    	        description = "Unauthorized, invalid cookie, or expired session"
    	    ),
    	    @ApiResponse(
    	        responseCode = "503",
    	        description = "Global PC2 contest data unavailable"
    	    ),
    	    @ApiResponse(
    	        responseCode = "500",
    	        description = "Unexpected internal server error"
    	    )
    	})
    @GET
    @Path("/scoreboard")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getScoreboard(
        @Context HttpServletRequest req
    ) {
    	
    	 String token = CookiesHandlers.getCookie(
                 req.getCookies(),
                 CookiesHandlers.AUTH_COOKIE_NAME
             );

             if (token == null || token.trim().isEmpty() || !isValidToken(token)) {
                 throw new UnauthorizedSessionException("Not logged in. Session is invalid or expired.");
             }

             ServerConnection userConn = sessions.get(token);

             if (userConn == null || !userConn.isLoggedIn()) {
                 throw new UnauthorizedSessionException("Not logged in. Session is invalid or expired.");
             }
             
             
            //Make sure that there is a valid DSA to use
             if (dsa==null) {
     			System.out.println("No DefaultScoringAlgorithm instance available");
     			return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
     					.entity(new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR,"DefaultScoringAlgorithm in null in ContestController"))
     					.type(MediaType.APPLICATION_JSON).build();
     		}
             
             
            //Be sure that only one client (browser) updates the standings
             try {
            	 
	             synchronized (standingsMutex) {
	            	 
	            	 calcStandings();

	            	 //In all cases, return the content of json cache :-)
	            	 return Response.ok().entity(JSONStandingsCache).type(MediaType.APPLICATION_JSON).build();
	            	 
	             }	            
             } catch ( ContestNullException e) {
            	 
            	 return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(
	     					new ApiException(Response.Status.INTERNAL_SERVER_ERROR,e.getMessage()))
	     					.type(MediaType.APPLICATION_JSON).build();
            	 
             } catch (JsonProcessingException e) {
				
					return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(
	     					new ApiException(Response.Status.INTERNAL_SERVER_ERROR,e.getMessage()))
	     					.type(MediaType.APPLICATION_JSON).build();
				
             } catch (NotLoggedInException e1) {			//There is no scoreboard account logged in!!!
            	 
     			return Response.status(Response.Status.UNAUTHORIZED).entity(
    					new APIErrorModel(Response.Status.UNAUTHORIZED, "Unauthorized user request - not logged in"))
    					.type(MediaType.APPLICATION_JSON).build();
     			
    		} catch (JSONException e) {
    			
    			logger.throwing(this.getClass().getName(), "getJSONStandings()", e);
				return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
						.entity(new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR,
								"IOException (JsonProcessingException?) in ContestController.getJSONStandings()"))
						.type(MediaType.APPLICATION_JSON).build();
				
			} catch (IllegalContestState e) {
				
				logger.throwing(dsa.getClass().getName(), "getStandings()", e);
				return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
						.entity(new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR,
								"IllegalContestStateException in DefaultScoringAlgorithm"))
						.type(MediaType.APPLICATION_JSON).build();
				
			} catch (IOException e) {
				
				logger.throwing(this.getClass().getName(), "getJSONStandings()", e);
				return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
						.entity(new APIErrorModel(Response.Status.INTERNAL_SERVER_ERROR,
								"IOException (JsonProcessingException?) in ContestController.getJSONStandings()"))
						.type(MediaType.APPLICATION_JSON).build();

			}

    }

    
    /*
     * Helper method to calculate the standings and store it in the cache. It must be run from inside synchronize to prevent racing
     */
    public static void calcStandings() throws NotLoggedInException , IllegalContestState, JSONException, IOException {
    	//No filter, show all teams in all divisions
   	 boolean useDivisionFilter = false;
   	 
   	 //In case there is an update/1st request. 
   	 if ( scoreboardCacheInvalidate ) {
   	//We need to get the Internal Contest to get the new standings	            		 									
		 IInternalContest internalContest = scoreboardServerConn.getContest().getInternalContest();
		 if (internalContest == null) 
			 throw new ContestNullException("InternalContest is null in ScoreboardServerConnection");
	
		//Get the default DSA properties, 
		 Properties props = DefaultScoringAlgorithm.getDefaultProperties();
		//Construct the XML object hold the standings
		 String xmlStandings = null;
		 Run[] runs = null;
		 
		//Get the contest runs
		 runs = internalContest.getRuns();
		//Calculates the standings for that runs in the current contest
		 xmlStandings = dsa.getStandings(internalContest, runs, null, props, logger);
		//Now convert the standings XML format to JSON format
		 logger.info("Converting DSA XML to JSON");			 
		 JSONStandingsCache = getJSONStandings(xmlStandings);
		//System.out.println(JSONStandingsCache);
		 objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);
		 JSONStandingsCacheObj = objectMapper.readValue(JSONStandingsCache, StandingObjModel.class);
		//Now, the cache updated, do not contact the PC2 server until any update to the standings
		 scoreboardCacheInvalidate = false;		 
   	 }
    }
    
    
    /*
     * Helper getter to return the Standings in Java Obj
     */
    public static StandingObjModel getStandingObj() {
    	return JSONStandingsCacheObj;
    }
    
    
    
    
    @Operation(
    	    summary = "Get the current contest state (Running or no)",
    	    description = "Returns the current contest state. True for running, false for anything else."
    	)
    	@ApiResponses({
    	    @ApiResponse(
    	        responseCode = "200",
    	        description = "Scoreboard standings retrieved successfully",
    	        content = @Content(
    	            mediaType = "application/json",
    	            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
    	                schema = @Schema(
    	                    implementation = ContestStateResponse.class
    	                )
    	            )
    	        )
    	    ),
    	    @ApiResponse(
    	        responseCode = "401",
    	        description = "Unauthorized, invalid cookie, or expired session"
    	    ),
    	    @ApiResponse(
    	        responseCode = "503",
    	        description = "Global PC2 contest data unavailable"
    	    ),
    	    @ApiResponse(
    	        responseCode = "500",
    	        description = "Unexpected internal server error"
    	    )
    	})
    @GET
    @Path("/isrunning")
    @Produces(MediaType.APPLICATION_JSON)
    public Response getContestState(
        @Context HttpServletRequest req
    ) {
    	
    	 String token = CookiesHandlers.getCookie(
                 req.getCookies(),
                 CookiesHandlers.AUTH_COOKIE_NAME
             );

             if (token == null || token.trim().isEmpty() || !isValidToken(token)) {
                 throw new UnauthorizedSessionException("Not logged in. Session is invalid or expired.");
             }

             ServerConnection userConn = sessions.get(token);
             
             try {
				IContest currentContest = userConn.getContest();
				Boolean contestIsRun = GlobalClass.isRun(currentContest);
				ContestStateResponse res =
	            		 new ContestStateResponse(contestIsRun);
				
				return Response.ok(res)		                
		                .type(MediaType.APPLICATION_JSON)
		                .build();
				
				
				
             } catch (NotLoggedInException e) {
				return Response.status(Response.Status.UNAUTHORIZED).entity(
    					new APIErrorModel(Response.Status.UNAUTHORIZED, "Unauthorized user request - not logged in"))
    					.type(MediaType.APPLICATION_JSON).build();
             }
    }
    
   
    
    /**
	 * Returns a JSON String containing the standings represented by the given XML Document String.
	 * 
	 * The JSON representation is created by first converting the given XML Document to a 
	 * {@link Standings} object, then invoking {@link Standings#toJSON()} on that object.
	 * 
	 * @param xmlStandings a String containing an XML Document with contest standings in the XML format produced 
	 * 					by {@link DefaultScoringAlgorithm#getStandings()}
	 * 
	 * @throws IOException if an error occurs in converting the Standings object to JSON form
	 * @throws JSONException 
	 * 
	 */
	private static String getJSONStandings(String xmlStandings) throws IOException, JSONException {
		
		JSONObject jsonStandingsObject = XML.toJSONObject(xmlStandings);;
		
		return jsonStandingsObject.toString();

	}

	
	/**
	 * Returns the flag indicating whether the cached copy of the contest standings are not valid (true),
	 * or instead there are no some event has occured which potentially makes the standings out of date (false).
	 * 
	 * @return true if the cached contest standings are not current; false if otherwise.
	 */
	public boolean getCacheInvalidationFlag() {
		return scoreboardCacheInvalidate;
	}

	/**
	 * Sets the invalidation flag indicating that the cached copy of the contest standings should no longer be considered current.
	 * This method is intended to be called by listeners which listen for contest state changes which could cause standings
	 * to be invalid.
	 * 
	 * @param cacheInvalidationFlag the value to which the standings flag should be set.
	 */
	public void setCacheInvalidationFlag(boolean cacheInvalidationFlag) {
		maincontroller.scoreboardCacheInvalidate = cacheInvalidationFlag;
	}
	
    

    private void recordFailedLogin(String username) {
        // Prevent map unbounded growth (DoS) by cleaning up expired locks
        long now = System.currentTimeMillis();
        lockoutTime.entrySet().removeIf(entry -> now > entry.getValue());
        
        // Remove attempts for users who are no longer locked out
        loginAttempts.keySet().removeIf(user -> !lockoutTime.containsKey(user) && loginAttempts.getOrDefault(user, 0) >= MAX_ATTEMPTS);

        int attempts = loginAttempts.getOrDefault(username, 0) + 1;
        loginAttempts.put(username, attempts);

        if (attempts >= MAX_ATTEMPTS) {
            lockoutTime.put(username, now + LOCK_TIME);
        }
    }

    private void clearLoginFailures(String username) {
        loginAttempts.remove(username);
        lockoutTime.remove(username);
    }
    
    
    
    
    
    
 // --- AUTHENTICATION ---
    @Operation(
            summary = "User login",
            description = "Authenticates a team user using username and password, creates a session cookie, and returns a CSRF token."
        )
        @RequestBody(
            required = true,
            description = "Login credentials",
            content = @Content(
                mediaType = "application/json",
                schema = @Schema(implementation = LoginPage.class)
            )
        )
        @ApiResponses({
            @ApiResponse(
                responseCode = "200",
                description = "Login successful",
                content = @Content(
                    mediaType = "application/json",
                    schema = @Schema(implementation = LoginResponse.class)
                )
            ),
            @ApiResponse(responseCode = "400", description = "Missing credentials"),
            @ApiResponse(responseCode = "401", description = "Invalid username or password"),
            @ApiResponse(responseCode = "403", description = "Access denied: only team accounts are allowed"),
            @ApiResponse(responseCode = "429", description = "Too many failed attempts, account temporarily locked"),
            @ApiResponse(responseCode = "503", description = "PC2 service unavailable or server warm-up error")
        })

   /*
    * Login
    */
    @POST
    @Path("/login")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response loginApi(LoginPage req) {
    	System.out.println("This is the new version 1");
        if (req == null ||
            req.username == null ||
            req.password == null) {

            return Response.status(400)
                .entity("{\"error\":\"Missing credentials\"}")
                .build();
        }

        // Sanitize username against XSS payload injection
        String username = helpers.XssSanitizer.sanitize(req.username);

        if (isLockedOut(username)) {
            return Response.status(429)
                .entity("{\"error\":\"Too many failed attempts. Try later.\"}")
                .build();
        }

        try {

            ServerConnection conn =
                new ServerConnection();

            conn.login(
                req.username,
                req.password
            );

            IClient myClient =
                conn.getMyClient();

            if (myClient.getType() != ClientType.TEAM_CLIENT) {

                conn.logoff();

                return Response.status(403)
                    .entity("{\"error\":\"Only team accounts allowed\"}")
                    .build();
            }

            String displayName =
                myClient.getDisplayName();

            if (displayName == null ||
                displayName.isEmpty()) {

                displayName =
                    "Team_" + username;
            }

            String cookieID =
                CookiesHandlers.genCookieID(
                    "team",
                    username,
                    displayName
                );

            
            String csrfToken =
                CSRF_Token_Handler.generate(cookieID);
            

            sessions.put(cookieID, conn);

            registAllServices(
                conn.getContest(),
                cookieID,
                username
            );

            NewCookie authCookie =
                CookiesHandlers.createCookie(
                    cookieID
                );

            LoginResponse res =
            		 new LoginResponse(
                             username,
                             cookieID,
                             displayName,
                             csrfToken
                         );

            clearLoginFailures(username);

            utilities.ApiLogger.log("Success", username, displayName, "User logged in");

            return Response.ok(res)
                .cookie(authCookie)
                .type(MediaType.APPLICATION_JSON)
                .build();

        } catch (Throwable t) {

            recordFailedLogin(username);
            utilities.ApiLogger.log("Failed", username, "N/A", "User login failed");

            return Response.status(401)
                .entity("{\"error\":\"Login failed\"}")
                .build();
        }
    }

    
    // --- CONTEST DATA: LANGUAGES ---
       
       
       @Operation(
               summary = "List contest languages",
               description = "Returns the list of programming languages available for the authenticated team session."
           )
           @ApiResponses({
               @ApiResponse(
                   responseCode = "200",
                   description = "Languages retrieved successfully",
                   content = @Content(
                       mediaType = "application/json",
                       schema = @Schema(implementation = languageList.class)
                   )
               ),
               @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, invalid session, or invalid CSRF token"),
               @ApiResponse(responseCode = "404", description = "No languages available for this contest"),
               @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
               @ApiResponse(responseCode = "500", description = "Internal server error"),
               @ApiResponse(responseCode = "428", description = "Contest is not running")
           })

   /*
    * ListLanguages
    */

    @GET
    @Path("/listlanguages")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listlanguages(
        @Context HttpServletRequest req
    ) {

        try {

            String token =
                CookiesHandlers.getCookie(
                    req.getCookies(),
                    CookiesHandlers.AUTH_COOKIE_NAME
                );

            if (token == null || token.trim().isEmpty() || !isValidToken(token)) {
                throw new UnauthorizedSessionException("Invalid session");
            }

            ServerConnection userConn =
                sessions.get(token);

            if (userConn == null || !userConn.isLoggedIn()) {
                throw new UnauthorizedSessionException("Session is invalid or expired.");
            }
            IContest contest =
                userConn.getContest();
            
            
            if (contest == null) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }
            
            if ( ! isRun(contest) ) {
				return Response.status(Response.Status.PRECONDITION_REQUIRED).entity(
    					new NotRunningException("Contest is not running"))
    					.type(MediaType.APPLICATION_JSON).build();
            }

            
            ILanguage[] languages =
                contest.getLanguages();

            List<languageList> result =
                new ArrayList<>();
            
            
            if (languages!=null) {
            for (ILanguage lang : languages) {
            	if (lang == null) {
                    continue;
                }
                result.add(
                    new languageList(
                        lang.getName(),
                        lang.getCompilerCommandLine()
                    )
                );
              }
            }
            String loginName = "N/A";
            String displayName = "N/A";
            try {
                edu.csus.ecs.pc2.api.IClient client = userConn.getMyClient();
                loginName = client != null ? client.getLoginName() : "N/A";
                displayName = client != null ? client.getDisplayName() : "N/A";
            } catch (Exception ignore) {}
            utilities.ApiLogger.log("Success", loginName, displayName, "Listed languages");

            return Response.ok(result)
                .build();

        } catch (WebApplicationException e) {
            throw e;
        } catch (exceptions.ApiException e) {
            throw e;
        } catch (Exception e) {

            return Response.status(401)
                .entity("{\"error\":\"" + e.getMessage() + "\"}")
                .build();
        }
    }

       @Operation(
               summary = "List contest problems",
               description = "Returns the list of contest problems available for the authenticated team session."
           )
           @ApiResponses({
               @ApiResponse(
                   responseCode = "200",
                   description = "Problems retrieved successfully",
                   content = @Content(
                       mediaType = "application/json",
                       array = @io.swagger.v3.oas.annotations.media.ArraySchema(
                           schema = @Schema(implementation = listProblems.class)
                       )
                   )
               ),
               @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, invalid session, or invalid CSRF token"),
               @ApiResponse(responseCode = "404", description = "No problems found in this contest"),
               @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
               @ApiResponse(responseCode = "500", description = "Internal server error"),
               @ApiResponse(responseCode = "428", description = "Contest is not running")
           })

    /*
     * ListProblems
     */

    @GET
    @Path("/listProblem")
    @Produces(MediaType.APPLICATION_JSON)
    public Response listProblem(
        @Context HttpServletRequest req
    ) {

        try {

            String token =
                CookiesHandlers.getCookie(
                    req.getCookies(),
                    CookiesHandlers.AUTH_COOKIE_NAME
                );

            if (token == null || token.trim().isEmpty() || !isValidToken(token)) {
                throw new UnauthorizedSessionException("Invalid session");
            }

            ServerConnection userConn =
                sessions.get(token);

            if (userConn == null || !userConn.isLoggedIn()) {
                throw new UnauthorizedSessionException("Session is invalid or expired.");
            }
            IContest contest =
                userConn.getContest();
            
            
            if (contest == null) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }
            
            if ( ! isRun(contest) ) {
				return Response.status(Response.Status.PRECONDITION_REQUIRED).entity(
    					new NotRunningException("Contest is not running"))
    					.type(MediaType.APPLICATION_JSON).build();
            }

            IProblem[] problems =
                contest.getProblems();

            List<listProblems> result =
                new ArrayList<>();
            if(problems!=null) {
            for (IProblem p : problems) {

            	if (p == null) {
                    continue;
                }
            	
                result.add(
                    new listProblems(
                        p.getName(),
                        p.getShortName(),	
                        p.isDeleted()
                    )
                );
              }
            }
            String loginName = "N/A";
            String displayName = "N/A";
            try {
                edu.csus.ecs.pc2.api.IClient client = userConn.getMyClient();
                loginName = client != null ? client.getLoginName() : "N/A";
                displayName = client != null ? client.getDisplayName() : "N/A";
            } catch (Exception ignore) {}
            utilities.ApiLogger.log("Success", loginName, displayName, "Listed problems");

            return Response.ok(result)
                .build();

        } catch (WebApplicationException e) {
            throw e;
        } catch (exceptions.ApiException e) {
            throw e;
        } catch (Exception e) {

            return Response.status(401)
                .entity("{\"error\":\"" + e.getMessage() + "\"}")
                .build();
        }
    }

       
       
       
       
     /*  @GET
       @Path("/listBalloonColors")
       @Produces(MediaType.APPLICATION_JSON)
       public Response listBalloonColors(@Context HttpServletRequest req) {
           String token = CookiesHandlers.getCookie(
               req.getCookies(),
               CookiesHandlers.AUTH_COOKIE_NAME
           );

           if (token == null || token.trim().isEmpty() || !isValidToken(token)) {
               throw new UnauthorizedSessionException("Invalid session");
           }

           ServerConnection userConn = sessions.get(token);

           if (userConn == null || !userConn.isLoggedIn()) {
               throw new UnauthorizedSessionException("Session is invalid or expired.");
           }

           IContest contest = userConn.getContest();

           if (contest == null) {
               throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
           }

           IInternalContest internalContest = resolveInternalContest(contest);

           Problem[] problems = internalContest.getProblems();
           List<BalloonColorResponse> result = new ArrayList<>();

           if (problems != null) {
               for (Problem problem : problems) {
                   if (problem == null) {
                       continue;
                   }

                   String balloonColor = problem.getColorName() != null
                       ? problem.getColorName()
                       : "";

                   String rgbValue = problem.getColorRGB() != null
                       ? problem.getColorRGB()
                       : "";

                   result.add(
                       new BalloonColorResponse(
                           problem.getDisplayName() != null ? problem.getDisplayName() : "",
                           problem.getShortName() != null ? problem.getShortName() : "",
                           problem.getLetter() != null ? problem.getLetter() : "",
                           balloonColor,
                           rgbValue,
                           !problem.isActive()
                       )
                   );
               }
           }

           return Response.ok(result)
               .type(MediaType.APPLICATION_JSON)
               .build();
       }*/
       
       
    
   /*
    * logout
    */
       @Operation(
    		    summary = "Logout authenticated team",
    		    description = "Logs out the authenticated team, removes the backend session, clears the authentication cookie, and disconnects the team's WebSocket session."
    		)
    		@ApiResponses({
    		    @ApiResponse(
    		        responseCode = "200",
    		        description = "Logged out successfully",
    		        content = @Content(
    		            mediaType = "application/json",
    		            schema = @Schema(implementation = LogoutResponse.class)
    		        )
    		    ),
    		    @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, expired session, or already logged out"),
    		    @ApiResponse(responseCode = "500", description = "Internal server error")
    		})

       @DELETE
       @Path("/logout")
       @Produces(MediaType.APPLICATION_JSON)
       public Response logout(@Context HttpServletRequest req) {

           String token = CookiesHandlers.getCookie(
               req.getCookies(),
               CookiesHandlers.AUTH_COOKIE_NAME
           );

           if (token.trim().isEmpty()) {
               throw new NoCookieException("Authentication cookie is empty.");
           }

           try {
               CookiesHandlers.verifyCookie(token);
           } catch (NotVerifiedCookieException e) {
               throw e;
           } catch (Exception e) {
               throw new NotVerifiedCookieException("Invalid or expired authentication cookie", e);
           }

           ServerConnection activeConnection = sessions.get(token);

           if (activeConnection == null) {
               throw new UnauthorizedSessionException("Session is invalid or already expired.");
           }

           String username = null;
           String displayName = null;

           try {
               IClient client = activeConnection.getMyClient();

               if (client != null) {
                   username = client.getLoginName();
                   displayName = client.getDisplayName();
               }

               if (activeConnection.isLoggedIn()) {
                   activeConnection.logoff();
                   utilities.ApiLogger.log("Success", username, displayName, "User logged out");
               }

           } catch (Exception e) {
               System.err.println("Error during PC2 logoff: " + e.getMessage());
               utilities.ApiLogger.log("Failed", username != null ? username : "N/A", displayName != null ? displayName : "N/A", "Error during PC2 logoff: " + e.getMessage());

           } finally {
               sessions.remove(token);

               
               CSRF_Token_Handler.remove(token);
               

               ContestSocket.disconnectToken(token);
           }

           LogoutResponse res = new LogoutResponse(
               "Success",
               "Logged out successfully",
               username,
               displayName
           );

           return Response.ok(res)
               .cookie(CookiesHandlers.clearAuthCookie())
               .type(MediaType.APPLICATION_JSON)
               .build();
       }
       

       
       
       
       @Operation(
    		    summary = "Validate current team session",
    		    description = "Checks whether the browser authentication cookie belongs to a valid logged-in PC2 session."
    		)
    		@ApiResponses({
    		    @ApiResponse(
    		        responseCode = "200",
    		        description = "Session is valid",
    		        content = @Content(
    		            mediaType = "application/json",
    		            schema = @Schema(implementation = SessionResponse.class)
    		        )
    		    ),
    		    @ApiResponse(
    		        responseCode = "401",
    		        description = "Session is invalid, missing, expired, or PC2 connection is no longer active",
    		        content = @Content(
    		            mediaType = "application/json",
    		            schema = @Schema(implementation = SessionResponse.class)
    		        )
    		    ),
    		    @ApiResponse(responseCode = "500", description = "Internal server error")
    		})
    		@GET
    		@Path("/session")
    		@Produces(MediaType.APPLICATION_JSON)
    		public Response validateToken(@Context HttpServletRequest req) {
    		    String token = CookiesHandlers.getCookie(
    		        req.getCookies(),
    		        CookiesHandlers.AUTH_COOKIE_NAME
    		    );

    		    if (token == null || !isValidToken(token) || !sessions.containsKey(token)) {
    		        return Response.status(Response.Status.UNAUTHORIZED)
    		            .entity(new SessionResponse(
    		                false,
    		                "Invalid or missing token."
    		            ))
    		            .type(MediaType.APPLICATION_JSON)
    		            .build();
    		    }

    		    ServerConnection userConn = sessions.get(token);

    		    if (userConn == null || !userConn.isLoggedIn()) {
    		        sessions.remove(token);

    		        return Response.status(Response.Status.UNAUTHORIZED)
    		            .entity(new SessionResponse(
    		                false,
    		                "Token exists, but PC2 connection is no longer active."
    		            ))
    		            .type(MediaType.APPLICATION_JSON)
    		            .build();
    		    }

    		    String loginName = "N/A";
    		    String displayName = "N/A";
    		    try {
    		        edu.csus.ecs.pc2.api.IClient client = userConn.getMyClient();
    		        loginName = client != null ? client.getLoginName() : "N/A";
    		        displayName = client != null ? client.getDisplayName() : "N/A";
    		    } catch (Exception ignore) {}
    		    utilities.ApiLogger.log("Success", loginName, displayName, "Checked session");

    		    return Response.ok(new SessionResponse(
    		        true,
    		        "Session is valid."
    		    ))
    		        .type(MediaType.APPLICATION_JSON)
    		        .build();
    		}
       
       
       /*
        * Method that return the current scoreboardServerConn value
        */
       public static ServerConnection getScoreboardConnection() {
    	   return scoreboardServerConn;
       }


}