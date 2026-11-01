package exceptions;

import javax.ws.rs.core.Response;

public class PC2ServiceUnavailableException extends ApiException {

    public PC2ServiceUnavailableException(String message) {
        super(Response.Status.SERVICE_UNAVAILABLE, message);
    }
}