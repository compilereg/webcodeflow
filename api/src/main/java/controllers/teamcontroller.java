package controllers;

import java.io.File;
import java.io.IOException;
import java.net.URISyntaxException;
import java.util.ArrayList;
import java.util.List;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

import org.json.JSONException;

import com.fasterxml.jackson.core.JsonProcessingException;

import Model.APIErrorModel;
import Model.SubmitClarificationRequest;
import Model.SubmitClarificationResponse;
import Model.SubmitRunRequest;
import Model.SubmitRunResponse;
import Model.TeamRankModel;
import Model.listclarification;
import Model.listsubmitrun;
import edu.csus.ecs.pc2.api.IClarification;
import edu.csus.ecs.pc2.api.IClient;
import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.IContestClock;
import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;
import edu.csus.ecs.pc2.api.IRun;
import edu.csus.ecs.pc2.api.IStanding;
import edu.csus.ecs.pc2.api.ITeam;
import edu.csus.ecs.pc2.api.PC2APIFile;
import edu.csus.ecs.pc2.api.ServerConnection;
import edu.csus.ecs.pc2.api.exceptions.LoginFailureException;
import edu.csus.ecs.pc2.api.exceptions.NotLoggedInException;
import edu.csus.ecs.pc2.core.exception.IllegalContestState;
import edu.csus.ecs.pc2.core.model.IFile;
import exceptions.ApiException;
import exceptions.ContestNullException;
import exceptions.NotRunningException;
import exceptions.PC2ServiceUnavailableException;
import exceptions.UnauthorizedSessionException;
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
import utilities.FileUtility;
import utilities.MultiFileDecodeResult;
import utilities.ProblemResolver;
import utilities.SubmitRunValidationResult;
import utilities.SubmitRunValidator;


@Path("/team")
@Tag(name = "Team", description = "Team-specific contest endpoints")
@OpenAPIDefinition(
	    servers = {
	        @Server(url = "/api", description = "API base path")
	    }
	)
public class teamcontroller extends GlobalClass {


		int myRank = 0;

        public teamcontroller() throws URISyntaxException, LoginFailureException, NotLoggedInException {
		super();
		// TODO Auto-generated constructor stub
	}

        @Operation(
                summary = "Get the logged in team rank in the contest",
                description = "Returns Rank of the logged-in team during contest when no freeze time."
            )
            @ApiResponses({
                @ApiResponse(
                    responseCode = "200",
                    description = "Team rank",
                    content = @Content(
                        mediaType = "application/json",
                        array = @io.swagger.v3.oas.annotations.media.ArraySchema(
                            schema = @Schema(implementation = TeamRankModel.class)
                        )
                    )
                ),
                @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, invalid session, or invalid CSRF token"),
                @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
                @ApiResponse(responseCode = "500", description = "Internal server error"),
                @ApiResponse(responseCode = "428", description = "Contest is not running")
            })

     /*
      * Get Rank
      */

     @GET
     @Path("/getrank")
     @Produces(MediaType.APPLICATION_JSON)
     public Response getTeamRank(
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
             String currentTeamName = userConn.getMyClient().getLoginName();
             int currentTeamNumber =  userConn.getMyClient().getAccountNumber();
                       
             /*
              * This means no one call /scoreboard 
              * We want to call calcStandings once at the maincontroller constructor
              */
             if ( maincontroller.getStandingObj()  == null) {
	                 //Be sure that only one client (browser) updates the standings
	                 try {
	                	 
	    	             synchronized (maincontroller.standingsMutex) {
	    	            	 
	    	            	 maincontroller.calcStandings();	
	    	            	 
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
	    				
	    				logger.throwing(maincontroller.dsa.getClass().getName(), "getStandings()", e);
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
             myRank = maincontroller.getStandingObj().getContestStandings().getTeamRank(currentTeamName);             
            	     
 
	           //TeamRankModel
	             return Response.ok(new TeamRankModel(currentTeamName,myRank)).
	            		 type(MediaType.APPLICATION_JSON).build();
			} catch (NotLoggedInException e) {
				return Response.status(Response.Status.UNAUTHORIZED).entity(
    					new APIErrorModel(Response.Status.UNAUTHORIZED, "Unauthorized user request - not logged in"))
    					.type(MediaType.APPLICATION_JSON).build();
			}   	
        	
         }
        
        
		@Operation(
                    summary = "List team clarifications",
                    description = "Returns the list of clarifications visible to the authenticated team."
                )
                @ApiResponses({
                    @ApiResponse(
                        responseCode = "200",
                        description = "Clarifications retrieved successfully",
                        content = @Content(
                            mediaType = "application/json",
                            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
                                schema = @Schema(implementation = listclarification.class)
                            )
                        )
                    ),
                    @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, or expired session"),
                    @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
                    @ApiResponse(responseCode = "500", description = "Internal server error")
                })



        @GET
        @Path("/listClarification")
        @Produces(MediaType.APPLICATION_JSON)
        public Response listClarification(@Context HttpServletRequest req) {

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
            IContest contest;

            try {
                contest = userConn.getContest();
            } catch (Exception e) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }

            if (contest == null) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }

            String loginName = "N/A";
            String displayName = "N/A";
            try {
                edu.csus.ecs.pc2.api.IClient client = userConn.getMyClient();
                loginName = client != null ? client.getLoginName() : "N/A";
                displayName = client != null ? client.getDisplayName() : "N/A";
            } catch (Exception ignore) {}

            IClarification[] clarifications = contest.getClarifications();
            List<listclarification> result = new ArrayList<>();

            if (clarifications != null) {
                for (IClarification clar : clarifications) {
                    if (clar == null) {
                        continue;
                    }

                    String teamLoginName = "";

                    if (clar.getTeam() != null && clar.getTeam().getLoginName() != null) {
                        teamLoginName = clar.getTeam().getLoginName();
                    }

                    boolean sendToAll = clar.isSendToAll();

                    // Private replies are visible only to the asking team.
                    // A judge can explicitly turn a reply into a broadcast with
                    // PC2's "Send to ALL teams" option.
                    if (
                        !sendToAll &&
                        !teamLoginName.equalsIgnoreCase(loginName)
                    ) {
                        continue;
                    }

                    String status = sendToAll
                        ? "Broadcast"
                        : clar.isAnswered() ? "Answered" : "New";

                    String problemName = "General";

                    if (clar.getProblem() != null && clar.getProblem().getName() != null) {
                        problemName = clar.getProblem().getName();
                    }

                    String question = clar.getQuestion() != null ? clar.getQuestion() : "";
                    String answer = clar.getAnswer() != null ? clar.getAnswer() : "";

                    listclarification li = new listclarification(
                        teamLoginName,
                        clar.getNumber(),
                        (int) clar.getSubmissionTime(),
                        status,
                        problemName,
                        question,
                        answer
                    );

                    result.add(li);
                }
            }

            utilities.ApiLogger.log("Success", loginName, displayName, "Listed clarifications");

            return Response.ok(result)
                .type(MediaType.APPLICATION_JSON)
                .build();
        }
            
            
            // 2. ✅ Read directly from cache instead of asking PC2
           /* List<ClarificationCache.ClarificationEntry> cached = ClarificationCache.getAll();

            System.out.println("[DEBUG] Clarifications in cache: " + cached.size());

            // 3. Map cache entries to your model
            List<listclarification> result = new ArrayList<>();
            for (ClarificationCache.ClarificationEntry entry : cached) {
                listclarification li = new listclarification(
                    "",                  // team login name (not available from event)
                    entry.number,
                    0,                   // submission time (not available from event)
                    entry.answered ? "Answered" : "New",
                    entry.problem,
                    entry.question,
                    entry.answer
                );
                result.add(li);
            }*/

            


        
        @Operation(
        	    summary = "List team submitted runs",
        	    description = "Returns the list of submitted runs visible to the authenticated team, including judgement state and run status."
        	)
        	@ApiResponses({
        	    @ApiResponse(
        	        responseCode = "200",
        	        description = "Submitted runs retrieved successfully",
        	        content = @Content(
        	            mediaType = "application/json",
        	            array = @io.swagger.v3.oas.annotations.media.ArraySchema(
        	                schema = @Schema(implementation = listsubmitrun.class)
        	            )
        	        )
        	    ),
        	    @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, or expired session"),
        	    @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
        	    @ApiResponse(responseCode = "500", description = "Internal server error")
        	})
        @GET
        @Path("/listSubmitRuns")
        @Produces(MediaType.APPLICATION_JSON)
        public Response listSubmitRuns(@Context HttpServletRequest req) {

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
            IContest contest;

            try {
                contest = userConn.getContest();
            } catch (Exception e) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }

            if (contest == null) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }

            IRun[] runs = contest.getRuns();
            List<listsubmitrun> result = new ArrayList<>();

            if (runs != null) {
                for (IRun run : runs) {
                    if (run == null) {
                        continue;
                    }
                    

                    IProblem problem = run.getProblem();
                    ILanguage language = run.getLanguage();

                    String problemName = problem != null ? problem.getName() : "";
                    String languageName = language != null ? language.getName() : "";

                    boolean finalJudged = run.isFinalJudged();
                    boolean preliminaryJudged = run.isPreliminaryJudged();
                    

                    String judgement;

                    if (finalJudged || preliminaryJudged) {
                        judgement = run.getJudgementName() != null
                            ? run.getJudgementName()
                            : "";
                    } else {
                        judgement = "NEW";
                    }

                    listsubmitrun li = new listsubmitrun(
                        run.getSiteNumber(),
                        run.getNumber(),
                        problemName,
                        languageName,
                        judgement,
                        finalJudged,
                        preliminaryJudged,
                        run.isSolved(),
                        run.isDeleted(),
                        (int) run.getSubmissionTime()
                    );

                    result.add(li);
                }
            }

            result.sort(
                (left, right) -> {
                    int siteCompare = Integer.compare(
                        left.getSiteNumber(),
                        right.getSiteNumber()
                    );

                    if (siteCompare != 0) {
                        return siteCompare;
                    }

                    return Integer.compare(
                        left.getRunNumber(),
                        right.getRunNumber()
                    );
                }
            );

            String loginName = "N/A";
            String displayName = "N/A";
            try {
                edu.csus.ecs.pc2.api.IClient client = userConn.getMyClient();
                loginName = client != null ? client.getLoginName() : "N/A";
                displayName = client != null ? client.getDisplayName() : "N/A";
            } catch (Exception ignore) {}
            utilities.ApiLogger.log("Success", loginName, displayName, "Listed submit runs");

            return Response.ok(result)
                .type(MediaType.APPLICATION_JSON)
                .build();
        }
        

        @Operation(
                    summary = "Submit clarification",
                    description = "Submits a clarification question for a specific problem or clarification category."
                )
                @RequestBody(
                    required = true,
                    description = "Clarification submission payload",
                    content = @Content(
                        mediaType = "application/json",
                        schema = @Schema(implementation = SubmitClarificationRequest.class)
                    )
                )
                @ApiResponses({
                    @ApiResponse(responseCode = "200", description = "Clarification submitted successfully"),
                    @ApiResponse(responseCode = "400", description = "Invalid request payload, missing question, or invalid problem/category"),
                    @ApiResponse(responseCode = "401", description = "Unauthorized, invalid cookie, or expired session"),
                    @ApiResponse(responseCode = "403", description = "Clarifications cannot be submitted while contest is paused or stopped"),
                    @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
                    @ApiResponse(responseCode = "500", description = "Unexpected internal server error")
                })


        @POST
        @Path("/submitClarification")
        @Consumes(MediaType.APPLICATION_JSON)
        @Produces(MediaType.APPLICATION_JSON)
        public Response submitClarification(
            @Context HttpServletRequest req,
            SubmitClarificationRequest payload
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
            IContest contest;

            try {
                contest = userConn.getContest();
            } catch (Exception e) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }

            if (contest == null) {
                throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
            }

            IContestClock contestClock = contest.getContestClock();

            if (contestClock == null || !contestClock.isContestClockRunning()) {
                throw new ApiException(
                    Response.Status.FORBIDDEN,
                    "Clarifications cannot be submitted while the contest is stopped or paused."
                );
            }

            if (payload == null) {
                throw new ApiException(
                    Response.Status.BAD_REQUEST,
                    "Request body is required."
                );
            }

            String problemName = payload.ProblemName == null
                ? ""
                : helpers.XssSanitizer.sanitize(payload.ProblemName.trim());

            String questionText = payload.Question == null
                ? ""
                : helpers.XssSanitizer.sanitize(payload.Question.trim());

            if (questionText.isEmpty()) {
                throw new ApiException(
                    Response.Status.BAD_REQUEST,
                    "Question text cannot be empty."
                );
            }

            IProblem selectedProblem = ProblemResolver.findClarificationCategoryOrProblem(
                contest,
                problemName
            );

            if (selectedProblem == null) {
                throw new ApiException(
                    Response.Status.BAD_REQUEST,
                    "Category/Problem '" + problemName + "' not found."
                );
            }

            String loginName = "N/A";
            String displayName = "N/A";
            try {
                IClient client = userConn.getMyClient();
                loginName = client != null ? client.getLoginName() : "N/A";
                displayName = client != null ? client.getDisplayName() : "N/A";
            } catch (Exception ignore) {}

            try {
                userConn.submitClarification(selectedProblem, questionText);
                utilities.ApiLogger.log("Success", loginName, displayName, "Submitted clarification for problem: " + problemName);
            } catch (Exception e) {
                utilities.ApiLogger.log("Failed", loginName, displayName, "Unable to submit clarification to PC2 server");
                throw new PC2ServiceUnavailableException(
                    "Unable to submit clarification to PC2 server."
                );
            }

            SubmitClarificationResponse res = new SubmitClarificationResponse(
                "Success",
                "Clarification submitted"
            );

            return Response.ok(res)
                .type(MediaType.APPLICATION_JSON)
                .build();
        }


        @Operation(
                    summary = "Submit run",
                    description = "Submits a solution run for a problem using the selected language and Base64-encoded source files."
                )
                @RequestBody(
                    required = true,
                    description = "Run submission payload",
                    content = @Content(
                        mediaType = "application/json",
                        schema = @Schema(implementation = SubmitRunRequest.class)
                    )
                )
                @ApiResponses({
                    @ApiResponse(responseCode = "200", description = "Run submitted successfully"),
                    @ApiResponse(responseCode = "400", description = "Validation errors in problem, language, or submitted files"),
                    @ApiResponse(responseCode = "401", description = "Unauthorized, invalid session, or invalid/missing CSRF token"),
                    @ApiResponse(responseCode = "503", description = "PC2 contest data unavailable"),
                    @ApiResponse(responseCode = "500", description = "Unexpected internal server error")
                })

    
        @POST
        @Path("/submitRun")
        @Consumes(MediaType.APPLICATION_JSON)
        @Produces(MediaType.APPLICATION_JSON)
        public Response submitRun(SubmitRunRequest request, @Context HttpServletRequest req) {
            MultiFileDecodeResult fileResult = null;

            try {
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
                IContest contest;

                try {
                    contest = userConn.getContest();
                } catch (Exception e) {
                    throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
                }

                if (contest == null) {
                    throw new PC2ServiceUnavailableException("Unable to retrieve contest data.");
                }

                SubmitRunValidationResult validation = SubmitRunValidator.validate(contest, request);

                
                System.out.println("Incoming requst ---- " + request.getMainFile().getFileContentBase64());
                
                fileResult = FileUtility.decodeSubmissionFiles(
                    request != null ? request.getMainFile() : null,
                    request != null ? request.getAdditionalFiles() : null
                );

                List<String> allErrors = new ArrayList<>();

                if (validation.hasErrors()) {
                    allErrors.addAll(validation.getErrors());
                }

                if (fileResult.hasErrors()) {
                    allErrors.addAll(fileResult.getErrors());
                }

                if (!allErrors.isEmpty()) {
                    throw new ApiException(
                        Response.Status.BAD_REQUEST,
                        String.join(" | ", allErrors)
                    );
                }

                String[] additionalFilePaths = fileResult.getAdditionalTempFiles()
                    .stream()
                    .map(File::getAbsolutePath)
                    .toArray(String[]::new);

                String loginName = "N/A";
                String displayName = "N/A";
                try {
                    IClient client = userConn.getMyClient();
                    loginName = client != null ? client.getLoginName() : "N/A";
                    displayName = client != null ? client.getDisplayName() : "N/A";
                } catch (Exception ignore) {}

                try {
                	/*
                    userConn.submitJudgeRun(
                        validation.getProblem(),
                        validation.getLanguage(),
                        fileResult.getMainTempFile().getAbsolutePath(),
                        additionalFilePaths
                    );*/
                	IFile main = new PC2APIFile(request.getMainFile().getFileName(), request.getMainFile().getFileContentBase64());
                    userConn.submitJudgeRun(
                            validation.getProblem(),
                            validation.getLanguage(),
                            main                            
                            );
                	
                    System.out.println("solution " + fileResult.getMainTempFile().getAbsolutePath());
                    utilities.ApiLogger.log("Success", loginName, displayName, "Submitted run for problem: " + validation.getProblem().getName() + " in language " + validation.getLanguage().getName());
                } catch (Exception e) {
                    utilities.ApiLogger.log("Failed", loginName, displayName, "Unable to submit run to PC2 server");
                    throw new PC2ServiceUnavailableException("Unable to submit run to PC2 server.");
                }

                SubmitRunResponse res = new SubmitRunResponse(
                    "Success",
                    "Run submitted successfully"
                );

                return Response.ok(res)
                    .type(MediaType.APPLICATION_JSON)
                    .build();

            } finally {
                FileUtility.cleanupSubmissionFiles(fileResult);
            }
        }       
}
