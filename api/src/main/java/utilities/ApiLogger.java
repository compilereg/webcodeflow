package utilities;

import edu.csus.ecs.pc2.core.log.Log;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.logging.Level;
import java.io.File;

public class ApiLogger {
    private static Log pc2Log;
    private static final String LOG_DIRECTORY = "logs";
    private static final String LOG_FILENAME = "Team_Log.log";

    static {
        // Ensure logs directory exists
        File logDir = new File(LOG_DIRECTORY);
        if (!logDir.exists()) {
            logDir.mkdirs();
        }
        
        pc2Log = new Log("ApiLogger");
        pc2Log.setFileHandlers(LOG_DIRECTORY, LOG_FILENAME);
    }

    static public Log getLogger() {
    	
    	if ( pc2Log == null)
    		pc2Log = new Log("ApiLogger");
    	return pc2Log;    	
    }
    
    
    public static void log(String status, String username, String displayName, String action) {
        String time = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        // readable table format: 
        // | Time                | Status  | Username        | Display Name         | Action          
        String formattedMessage = String.format("| %-19s | %-7s | %-15s | %-20s | %s", time, status, username, displayName, action);
        
        pc2Log.log(Level.INFO, formattedMessage);
    }
}
