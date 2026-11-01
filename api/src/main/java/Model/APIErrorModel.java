package Model;

import javax.ws.rs.core.Response;

//import io.swagger.v3.oas.annotations.media.Schema;

//@Schema(name = "APIErrorModel", description = "Standard API error response")
public class APIErrorModel {

  //  @Schema(example = "Unauthorized")
    public Response.Status errorCode;

    //@Schema(example = "Not logged in. Session is invalid or expired.")
    private String message;

    public APIErrorModel() {
    	
    	
    }
    
    
    public APIErrorModel(Response.Status errorCode, String message) {
    	
    	this.errorCode = errorCode;
    	this.message = message; 	
    	
    }
    

    public Response.Status getError() {
        return errorCode;
    }

    public String getMessage() {
        return message;
    }
}