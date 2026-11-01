package exceptions;

import javax.ws.rs.core.Response;

public class NotVerifiedCookieException extends ApiException {

    public NotVerifiedCookieException() {
        super(Response.Status.UNAUTHORIZED, "Invalid authentication cookie");
    }

    public NotVerifiedCookieException(String message) {
        super(Response.Status.UNAUTHORIZED, message);
    }

    public NotVerifiedCookieException(String message, Throwable cause) {
        super(Response.Status.UNAUTHORIZED, message);
        initCause(cause);
    }
}