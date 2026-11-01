package exceptions;

import javax.ws.rs.core.Response;


public class NotRunningException extends ApiException {

//	private static final long serialVersionUID = 1L;

	public NotRunningException(String message) {
		
		 super(Response.Status.PRECONDITION_REQUIRED, message);
	}

}
