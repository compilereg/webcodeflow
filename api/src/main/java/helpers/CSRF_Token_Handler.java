package helpers;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

public class CSRF_Token_Handler {
    private static final Map<String, String> csrfTokens =
        new ConcurrentHashMap<>();

    /*
     * Generate token
     */
    public static String generate(String sessionToken) {

        String csrf =
            UUID.randomUUID().toString();

        csrfTokens.put(sessionToken, csrf);

        return csrf;
    }

    /**
     * Centralized CSRF + origin check for mutating/authenticated endpoints.
     */
    public static void validateRequest(
        HttpServletRequest req,
        String sessionToken
    ) {
        CorsConfig.validateOrigin(req);
        validate(req, sessionToken);
    }

    /*
     * Validate header token
     */
    public static void validate(
        HttpServletRequest req,
        String sessionToken
    ) {

        String header =
            req.getHeader("X-CSRF-Token");

        String expected =
            csrfTokens.get(sessionToken);

        if (header == null ||
            expected == null ||
            !header.equals(expected)) {

            throw new WebApplicationException(
                Response.status(403)
                    .entity(
                        "{\"error\":\"Invalid CSRF token\"}"
                    )
                    .type(MediaType.APPLICATION_JSON)
                    .build()
            );
        }
    }

    /*
     * Remove token on logout
     */
    public static void remove(
        String sessionToken
    ) {
        csrfTokens.remove(sessionToken);
    }
}
