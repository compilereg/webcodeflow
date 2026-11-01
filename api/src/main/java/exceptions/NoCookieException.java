package exceptions;

import javax.ws.rs.core.Response;

public class NoCookieException extends ApiException {

    public NoCookieException() {
        super(Response.Status.UNAUTHORIZED, "Missing authentication cookie");
    }

    public NoCookieException(String message) {
        super(Response.Status.UNAUTHORIZED, message);
    }
}