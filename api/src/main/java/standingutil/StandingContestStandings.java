package standingutil;

import java.util.List;

public class StandingContestStandings {
	
	private List<StandingTeamObjModel> teamStanding;
	private StandingHeaderObjModel standingsHeader;
	
	
	/*
	 * Return a team rank, if team not exists, return -1
	 */
	public int getTeamRank(String teamName) {
		int rank = -1;
		String teamLoginname;
		
		for(StandingTeamObjModel team: this.teamStanding) {
			teamLoginname="team"+team.getTeamId();
			if ( teamLoginname.equals(teamName)) {
				rank = team.getRank();
				break;
			}
		}
		
		return rank;
	}
	
	public List<StandingTeamObjModel> getTeamStanding() {
		return teamStanding;
	}
	public void setTeamStanding(List<StandingTeamObjModel> teamStanding) {
		this.teamStanding = teamStanding;
	}
	public StandingHeaderObjModel getStandingsHeader() {
		return standingsHeader;
	}
	public void setStandingsHeader(StandingHeaderObjModel standingsHeader) {
		this.standingsHeader = standingsHeader;
	}
	@Override
	public String toString() {
		return "StandingContestStandings [teamStanding=" + teamStanding + ", standingsHeader=" + standingsHeader + "]";
	}
	public StandingContestStandings(List<StandingTeamObjModel> teamStanding, StandingHeaderObjModel standingsHeader) {
		super();
		this.teamStanding = teamStanding;
		this.standingsHeader = standingsHeader;
	}
	
	public StandingContestStandings() {
		//Nothing to do
	}
	
}
