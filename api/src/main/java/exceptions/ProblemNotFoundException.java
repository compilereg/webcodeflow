package exceptions;

import javax.ws.rs.core.Response;

public class ProblemNotFoundException extends ApiException {

    public ProblemNotFoundException(String message) {
        super(Response.Status.NOT_FOUND, message);
    }
}