package helpers;

import java.util.Arrays;
import java.util.Collections;
import java.util.HashSet;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;

/**
 * Single place to control which origins are allowed (HTTP CORS + WebSocket).
 * Set {@link #ALLOW_ANY_ORIGIN} to false and use {@link #addAllowedOrigin(String)}
 * / the default allowlist when you want restricted origins again.
 */
public final class CorsConfig {

    /** When true, every Origin is accepted (browser CORS + server-side check). */
    public static final boolean ALLOW_ANY_ORIGIN = true;

    private static final Set<String> DEFAULT_ALLOWED_ORIGINS =
        Collections.unmodifiableSet(
            new HashSet<>(
                Arrays.asList(
                    "http://localhost:8080",
                    "http://localhost:3000",
                    "http://localhost:5173",
                    "http://wwffrontend.aast.edu"
                )
            )
        );

    private static final Set<String> EXTRA_ALLOWED_ORIGINS =
        new CopyOnWriteArraySet<>();

    public static final String ALLOWED_METHODS =
        "GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH";

    public static final String ALLOWED_HEADERS =
        "Origin, Content-Type, Accept, Authorization, X-CSRF-Token, X-Requested-With";

    public static final String EXPOSED_HEADERS =
        "Content-Type, X-CSRF-Token";

    private CorsConfig() {}

    public static void addAllowedOrigin(String origin) {
        if (origin == null) {
            return;
        }
        String trimmed = origin.trim();
        if (!trimmed.isEmpty()) {
            EXTRA_ALLOWED_ORIGINS.add(trimmed);
        }
    }

    public static boolean isOriginAllowed(String origin) {
        if (ALLOW_ANY_ORIGIN) {
            return true;
        }
        if (origin == null || origin.isEmpty()) {
            return true;
        }
        return DEFAULT_ALLOWED_ORIGINS.contains(origin)
            || EXTRA_ALLOWED_ORIGINS.contains(origin);
    }

    /**
     * Server-side Origin check (complements browser CORS headers).
     * No-ops for missing Origin (e.g. same-origin or non-browser clients).
     */
    public static void validateOrigin(HttpServletRequest req) {
        String origin = req.getHeader("Origin");

        if (origin != null && !isOriginAllowed(origin)) {
            throw new WebApplicationException(
                Response.status(Response.Status.FORBIDDEN)
                    .entity("{\"error\":\"Invalid origin\"}")
                    .type(MediaType.APPLICATION_JSON)
                    .build()
            );
        }
    }
}
