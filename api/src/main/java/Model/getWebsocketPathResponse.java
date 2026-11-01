package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "getWebsocketPathResponse", description = "Return the websocket url path")
public class getWebsocketPathResponse {
	
	@Schema(description = "Web socket path", example = "/ws/contest")
	private String socketPath;

	public String getSocketPath() {
		return socketPath;
	}

	public void setSocketPath(String socketPath) {
		this.socketPath = socketPath;
	}

	public getWebsocketPathResponse(String socketPath) {
		super();
		this.socketPath = socketPath;
	}
	


}
