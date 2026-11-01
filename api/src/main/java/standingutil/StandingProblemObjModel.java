package standingutil;

public class StandingProblemObjModel {
	
		private Boolean fts;
		private Boolean isSolved;
		private int 	index;
		private int 	solutionTime;
		private Boolean isPending;
		private String 	problemId;
		private String 	shortName;
		private int 	attempts;
		private int 	points;
		public Boolean getFts() {
			return fts;
		}
		public void setFts(Boolean fts) {
			this.fts = fts;
		}
		public Boolean getIsSolved() {
			return isSolved;
		}
		public void setIsSolved(Boolean isSolved) {
			this.isSolved = isSolved;
		}
		public int getIndex() {
			return index;
		}
		public void setIndex(int index) {
			this.index = index;
		}
		public int getSolutionTime() {
			return solutionTime;
		}
		public void setSolutionTime(int solutionTime) {
			this.solutionTime = solutionTime;
		}
		public Boolean getIsPending() {
			return isPending;
		}
		public void setIsPending(Boolean isPending) {
			this.isPending = isPending;
		}
		public String getProblemId() {
			return problemId;
		}
		public void setProblemId(String problemId) {
			this.problemId = problemId;
		}
		public String getShortName() {
			return shortName;
		}
		public void setShortName(String shortName) {
			this.shortName = shortName;
		}
		public int getAttempts() {
			return attempts;
		}
		public void setAttempts(int attempts) {
			this.attempts = attempts;
		}
		public int getPoints() {
			return points;
		}
		public void setPoints(int points) {
			this.points = points;
		}
		public StandingProblemObjModel(Boolean fts, Boolean isSolved, int index, int solutionTime, Boolean isPending,
				String problemId, String shortName, int attempts, int points) {
			super();
			this.fts = fts;
			this.isSolved = isSolved;
			this.index = index;
			this.solutionTime = solutionTime;
			this.isPending = isPending;
			this.problemId = problemId;
			this.shortName = shortName;
			this.attempts = attempts;
			this.points = points;
		}
		@Override
		public String toString() {
			return "StandingProblemObjModel [fts=" + fts + ", isSolved=" + isSolved + ", index=" + index
					+ ", solutionTime=" + solutionTime + ", isPending=" + isPending + ", problemId=" + problemId
					+ ", shortName=" + shortName + ", attempts=" + attempts + ", points=" + points + "]";
		}
		
		public StandingProblemObjModel() {
			//Nothing to do
		}

}
