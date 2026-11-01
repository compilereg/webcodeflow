package controllers;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import edu.csus.ecs.pc2.api.IContest;
import edu.csus.ecs.pc2.api.ServerConnection;
import edu.csus.ecs.pc2.api.implementation.Contest;
import edu.csus.ecs.pc2.core.log.Log;
import helpers.CookiesHandlers;
import services.ClarificationUpdates;
import services.ConfigurationUpdates;
import services.LogoffUpdates;
import services.SubmissionUpdates;
import utilities.ApiLogger;

public class GlobalClass {

    public static final Map<String, ServerConnection> sessions =
        new ConcurrentHashMap<>();

    protected static final Map<String, Integer> loginAttempts =
        new ConcurrentHashMap<>();

    protected static final Map<String, Long> lockoutTime =
        new ConcurrentHashMap<>();

    protected static Log logger = ApiLogger.getLogger();
    
    //A Helper method that returns the state of the current contest, true if running, false otherwise
    protected static Boolean isRun(IContest currentContest) {
    	return currentContest.isContestClockRunning();
    }

    
    protected void registAllServices(
        Contest teamContest,
        String jwt,
        String teamLoginName
    ) {
        if (teamContest == null) {
            throw new IllegalArgumentException(
                "teamContest must not be null"
            );
        }

        System.out.println(
            ">>> REGISTERING TEAM PC2 LISTENERS for JWT: " + jwt
        );

        teamContest.addContestConfigurationUpdateListener(
            new ConfigurationUpdates(teamContest, jwt)
        );

        teamContest.addClarificationListener(
            new ClarificationUpdates(teamContest, jwt, teamLoginName)
        );

        /*
         * This listener handles notifications for this team only.
         *
         * It must not update the global scoreboard. Global scoreboard
         * events are handled by ScoreboardUpdates on the dedicated
         * SCOREBOARD_CLIENT connection.
         */
        teamContest.addRunListener(
            new SubmissionUpdates(teamContest, jwt, teamLoginName)
        );

        teamContest.addConnectionListener(
            new LogoffUpdates(teamContest, jwt)
        );
    }
    
    
    /*
     *  Helpers
     */

    	protected boolean isValidToken(String token) {
            try {
                return token != null &&
                       CookiesHandlers.verifyCookie(token) &&
                       sessions.containsKey(token);
            } catch (Exception e) {
                return false;
            }
        }

        protected static boolean hasSession(String token) {
            return token != null &&
                   sessions.containsKey(token);
        }

        protected boolean isLockedOut(String username) {

            Long lock = lockoutTime.get(username);

            if (lock == null)
                return false;

            if (System.currentTimeMillis() > lock) {
                lockoutTime.remove(username);
                loginAttempts.remove(username);
                return false;
            }

            return true;
        }
        
        
        /*
         * A Method takes string and convert to seconds
         */
        protected long parseTimeToSeconds(String timeStr)  {
        	if (timeStr == null || timeStr.trim().isEmpty()) {
                return 0;
            }
            
            String[] parts = timeStr.trim().split(":");
            long totalSeconds = 0;
            
            try {
                if (parts.length == 3) {
                    // Format: HH:MM:SS
                    long hours = Long.parseLong(parts[0]);
                    long minutes = Long.parseLong(parts[1]);
                    long seconds = Long.parseLong(parts[2]);
                    totalSeconds = (hours * 3600) + (minutes * 60) + seconds;
                } else if (parts.length == 2) {
                    // Format: MM:SS
                    long minutes = Long.parseLong(parts[0]);
                    long seconds = Long.parseLong(parts[1]);
                    totalSeconds = (minutes * 60) + seconds;
                } else if (parts.length == 1) {
                    // Format: SS or raw minutes string
                    totalSeconds = Long.parseLong(parts[0]);
                }
            } catch (NumberFormatException e) {
                System.err.println("Failed to parse freeze time string: " + timeStr);
            }
            
            return totalSeconds;
        }

}