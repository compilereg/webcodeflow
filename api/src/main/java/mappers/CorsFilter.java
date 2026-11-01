package mappers;

import helpers.CorsConfig;

import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerRequestFilter;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.container.PreMatching;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.Provider;
import java.io.IOException;

/**
 * Applies CORS response headers from {@link CorsConfig} for all API requests.
 * Handles OPTIONS preflight before resource matching.
 */
@Provider
@PreMatching
public class CorsFilter implements ContainerRequestFilter, ContainerResponseFilter {

    @Override
    public void filter(ContainerRequestContext requestContext) throws IOException {
        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            String origin = requestContext.getHeaderString("Origin");
            if (origin != null && !CorsConfig.isOriginAllowed(origin)) {
                requestContext.abortWith(
                    Response.status(Response.Status.FORBIDDEN)
                        .entity("{\"error\":\"Invalid origin\"}")
                        .type("application/json")
                        .build()
                );
                return;
            }

            requestContext.abortWith(
                Response.ok()
                    .header("Access-Control-Allow-Origin", resolveAllowOrigin(origin))
                    .header("Access-Control-Allow-Credentials", "true")
                    .header("Access-Control-Allow-Methods", CorsConfig.ALLOWED_METHODS)
                    .header("Access-Control-Allow-Headers", CorsConfig.ALLOWED_HEADERS)
                    .header("Access-Control-Max-Age", "3600")
                    .build()
            );
        }
    }

    @Override
    public void filter(
        ContainerRequestContext requestContext,
        ContainerResponseContext responseContext
    ) {
        String origin = requestContext.getHeaderString("Origin");
        if (origin == null || !CorsConfig.isOriginAllowed(origin)) {
            return;
        }

        if (!responseContext.getHeaders().containsKey("Access-Control-Allow-Origin")) {
            responseContext.getHeaders().putSingle(
                "Access-Control-Allow-Origin",
                resolveAllowOrigin(origin)
            );
        }
        responseContext.getHeaders().putSingle("Access-Control-Allow-Credentials", "true");
        responseContext.getHeaders().putSingle(
            "Access-Control-Allow-Methods",
            CorsConfig.ALLOWED_METHODS
        );
        responseContext.getHeaders().putSingle(
            "Access-Control-Allow-Headers",
            CorsConfig.ALLOWED_HEADERS
        );
        responseContext.getHeaders().putSingle(
            "Access-Control-Expose-Headers",
            CorsConfig.EXPOSED_HEADERS
        );
        responseContext.getHeaders().putSingle("Vary", "Origin");
    }

    /**
     * Reflect request Origin so credentials (cookies) work.
     * With {@link CorsConfig#ALLOW_ANY_ORIGIN}, any Origin is echoed.
     */
    private static String resolveAllowOrigin(String origin) {
        if (origin == null || origin.isEmpty()) {
            return "*";
        }
        return origin;
    }
}
