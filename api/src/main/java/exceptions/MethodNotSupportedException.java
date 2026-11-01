package exceptions;

import javax.ws.rs.core.Response;

public class MethodNotSupportedException extends ApiException {

    public MethodNotSupportedException(String message) {
        super(Response.Status.METHOD_NOT_ALLOWED, message);
    }
}