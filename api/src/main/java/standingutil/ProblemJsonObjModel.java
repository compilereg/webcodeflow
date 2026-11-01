package standingutil;

public class ProblemJsonObjModel {
	private String color;
	private int lastSolutionTime;
	private String letter;
	private int bestSolutionTime;
	private int id;
	private String rgb;
	private String title;
	private int numberSolved;
	private String url;
	private int attempts;
	
	public ProblemJsonObjModel() {
		//No actions can be taken
	}
	
	@Override
	public String toString() {
		return "ProblemJsonObjModel [color=" + color + ", lastSolutionTime=" + lastSolutionTime + ", letter=" + letter
				+ ", bestSolutionTime=" + bestSolutionTime + ", id=" + id + ", rgb=" + rgb + ", title=" + title
				+ ", numberSolved=" + numberSolved + ", url=" + url + ", attempts=" + attempts + "]";
	}
	public ProblemJsonObjModel(String color, int lastSolutionTime, String letter, int bestSolutionTime, int id,
			String rgb, String title, int numberSolved, String url, int attempts) {
		super();
		this.color = color;
		this.lastSolutionTime = lastSolutionTime;
		this.letter = letter;
		this.bestSolutionTime = bestSolutionTime;
		this.id = id;
		this.rgb = rgb;
		this.title = title;
		this.numberSolved = numberSolved;
		this.url = url;
		this.attempts = attempts;
	}
	public String getColor() {
		return color;
	}
	public void setColor(String color) {
		this.color = color;
	}
	public int getLastSolutionTime() {
		return lastSolutionTime;
	}
	public void setLastSolutionTime(int lastSolutionTime) {
		this.lastSolutionTime = lastSolutionTime;
	}
	public String getLetter() {
		return letter;
	}
	public void setLetter(String letter) {
		this.letter = letter;
	}
	public int getBestSolutionTime() {
		return bestSolutionTime;
	}
	public void setBestSolutionTime(int bestSolutionTime) {
		this.bestSolutionTime = bestSolutionTime;
	}
	public int getId() {
		return id;
	}
	public void setId(int id) {
		this.id = id;
	}
	public String getRgb() {
		return rgb;
	}
	public void setRgb(String rgb) {
		this.rgb = rgb;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public int getNumberSolved() {
		return numberSolved;
	}
	public void setNumberSolved(int numberSolved) {
		this.numberSolved = numberSolved;
	}
	public String getUrl() {
		return url;
	}
	public void setUrl(String url) {
		this.url = url;
	}
	public int getAttempts() {
		return attempts;
	}
	public void setAttempts(int attempts) {
		this.attempts = attempts;
	}
	
	
}
