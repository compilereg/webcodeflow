package mappers;

import javax.ws.rs.WebApplicationException;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import javax.ws.rs.ext.ExceptionMapper;
import javax.ws.rs.ext.Provider;

import Model.APIErrorModel;

@Provider
public class ThrowableMapper implements ExceptionMapper<Throwable> {

    @Override
    public Response toResponse(Throwable exception) {
        if (exception instanceof WebApplicationException) {
            WebApplicationException webException = (WebApplicationException) exception;
            Response original = webException.getResponse();

            /*
            APIErrorModel error = new APIErrorModel(
                Response.Status.fromStatusCode(original.getStatus()) != null
                    ? Response.Status.fromStatusCode(original.getStatus()).getReasonPhrase()
                    : "Request Failed",
                exception.getMessage() != null ? exception.getMessage() : "Request failed"
            );
			*/
            
            APIErrorModel error = new APIErrorModel(
                    Response.Status.fromStatusCode(original.getStatus()) ,
                    exception.getMessage() != null ? exception.getMessage() : "Request failed"
            );

                    	
            return Response.status(original.getStatus())
                .entity(error)
                .type(MediaType.APPLICATION_JSON)
                .build();
        }

        exception.printStackTrace();

        APIErrorModel error = new APIErrorModel(
        		Response.Status.INTERNAL_SERVER_ERROR,
            "An unexpected internal server error occurred."
        );

        return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
            .entity(error)
            .type(MediaType.APPLICATION_JSON)
            .build();
    }
}