package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "SessionResponse", description = "Session validation response")
public class SessionResponse {

    @Schema(description = "Whether the browser cookie belongs to a valid logged-in session", example = "true")
    private boolean authenticated;

    @Schema(description = "Session validation message", example = "Session is valid.")
    private String message;

    public SessionResponse() {
    }

    public SessionResponse(boolean authenticated, String message) {
        this.authenticated = authenticated;
        this.message = message;
    }

    public boolean isAuthenticated() {
        return authenticated;
    }

    public String getMessage() {
        return message;
    }
}