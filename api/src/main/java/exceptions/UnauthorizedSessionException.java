package exceptions;

import javax.ws.rs.core.Response;

public class UnauthorizedSessionException extends ApiException {

    public UnauthorizedSessionException(String message) {
        super(Response.Status.UNAUTHORIZED, message);
    }
}