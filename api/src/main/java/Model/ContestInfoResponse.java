package Model;

import io.swagger.v3.oas.annotations.media.Schema;

@Schema(name = "ContestInfoResponse", description = "Current contest info")
public class ContestInfoResponse {
	
	@Schema(description = "Contest Title", example = "Egyptian Collegiate Programming Contest (ECPC)")
	private String ContestTitle;

	public String getContestTitle() {
		return ContestTitle;
	}

	public void setContestTitle(String contestTitle) {
		ContestTitle = contestTitle;
	}

	public ContestInfoResponse() {
		super();
		// TODO Auto-generated constructor stub
	}
	
	public ContestInfoResponse(String ContestTitle) {
		super();
		this.ContestTitle = ContestTitle;
		// TODO Auto-generated constructor stub
	}
}
