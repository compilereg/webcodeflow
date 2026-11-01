package Model;

import io.swagger.v3.oas.annotations.media.Schema;

public class TeamRankModel {
	 @Schema(description = "Team name")
	    public String teamName;

	    @Schema(description = "Team rank")
	    public int teamRank;

	    public TeamRankModel() {}

	    public TeamRankModel(String teamName, int teamRank) {
	        this.teamName = teamName;
	        this.teamRank = teamRank;
	    }
	   
}
