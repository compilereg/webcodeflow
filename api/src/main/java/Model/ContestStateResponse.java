package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ContestStateResponse", description = "Current contest state")
public class ContestStateResponse {
	
	@Schema(description = "Contest state run or no", example = "True")
	private Boolean isRun;

	public Boolean getIsRun() {
		return isRun;
	}

	public void setIsRun(Boolean isRun) {
		this.isRun = isRun;
	}

	public ContestStateResponse(Boolean isRun) {
		super();
		this.isRun = isRun;
	}
	
	

}
