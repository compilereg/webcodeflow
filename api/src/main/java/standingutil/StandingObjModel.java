package standingutil;

public class StandingObjModel {
	private StandingContestStandings contestStandings;

	public StandingContestStandings getContestStandings() {
		return contestStandings;
	}

	public void setContestStandings(StandingContestStandings contestStandings) {
		this.contestStandings = contestStandings;
	}

	@Override
	public String toString() {
		return "StandingObjModel [contestStandings=" + contestStandings + "]";
	}

	public StandingObjModel(StandingContestStandings contestStandings) {
		super();
		this.contestStandings = contestStandings;
	}
	
	public StandingObjModel() {
		//Nothing to do
	}
}
