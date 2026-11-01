package mappers;

import controllers.maincontroller;
import edu.csus.ecs.pc2.api.IClient;
import helpers.CookiesHandlers;
import utilities.ApiLogger;
import edu.csus.ecs.pc2.api.ServerConnection;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.container.ContainerRequestContext;
import javax.ws.rs.container.ContainerResponseContext;
import javax.ws.rs.container.ContainerResponseFilter;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.Cookie;
import javax.ws.rs.ext.Provider;

@Provider
public class FailedRequestLoggingFilter implements ContainerResponseFilter {

    @Context
    private HttpServletRequest httpRequest;

    @Override
    public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
        // If the status code is an error (400 or above)
        if (responseContext.getStatus() >= 400) {
            String loginName = "N/A";
            String displayName = "N/A";
            String endpointPath = "N/A";

            try {
                // Determine which endpoint failed
                if (httpRequest != null) {
                    endpointPath = httpRequest.getRequestURI();
                } else if (requestContext.getUriInfo() != null) {
                    endpointPath = requestContext.getUriInfo().getPath();
                }

                // Exclude the login endpoint because login failure is handled separately in maincontroller
                if (endpointPath != null && endpointPath.contains("/login")) {
                    return;
                }

                // Attempt to extract the user's details from their active session
                if (requestContext.getCookies() != null) {
                    Cookie authCookie = requestContext.getCookies().get(CookiesHandlers.AUTH_COOKIE_NAME);
                    if (authCookie != null && authCookie.getValue() != null) {
                        String token = authCookie.getValue();
                        ServerConnection userConn = maincontroller.sessions.get(token);
                        if (userConn != null && userConn.isLoggedIn()) {
                            IClient client = userConn.getMyClient();
                            if (client != null) {
                                loginName = client.getLoginName();
                                displayName = client.getDisplayName();
                            }
                        }
                    }
                }
            } catch (Exception ignore) {
                // Failsafe so the filter doesn't break the response
            }

            // Log the failure to Team_Log-0.log
            ApiLogger.log(
                "Failed", 
                loginName, 
                displayName, 
                "API call to " + endpointPath + " failed (Status " + responseContext.getStatus() + ")"
            );
        }
    }
}
