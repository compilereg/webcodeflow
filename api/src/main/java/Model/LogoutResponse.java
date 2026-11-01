package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "LogoutResponse", description = "Logout response payload")
public class LogoutResponse {

    @Schema(description = "Logout status", example = "Success")
    private String status;

    @Schema(description = "Logout response message", example = "Logged out successfully")
    private String message;

    @Schema(description = "Logged out username or session owner", example = "team001")
    private String username;

    @Schema(description = "Logged out display name", example = "Team 001")
    private String displayName;

    public LogoutResponse() {
    }

    public LogoutResponse(String status, String message, String username, String displayName) {
        this.status = status;
        this.message = message;
        this.username = username;
        this.displayName = displayName;
    }

    public String getStatus() {
        return status;
    }

    public String getMessage() {
        return message;
    }

    public String getUsername() {
        return username;
    }

    public String getDisplayName() {
        return displayName;
    }
}