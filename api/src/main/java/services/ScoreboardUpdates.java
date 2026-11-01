package services;

import javax.json.Json;
import javax.json.JsonObject;

import controllers.maincontroller;
import edu.csus.ecs.pc2.api.IRun;
import edu.csus.ecs.pc2.api.listener.ContestEvent;
import edu.csus.ecs.pc2.api.listener.IConfigurationUpdateListener;
import edu.csus.ecs.pc2.api.listener.IRunEventListener;
import websocket.ContestSocket;
import websocket.WebsocketMsgType;



public class ScoreboardUpdates implements IRunEventListener, IConfigurationUpdateListener {
	
	private maincontroller contestcontroller;
	
	
	/**
	 * Constructs a new ScoreboardUpdates which listens for changes in standings-related items 
	 * in the specified contest.  When a change which MAY cause the contest standings to alter is detected,
	 * the corresponding listener routine sets the 'scoreboardCacheInvalidate flag in the specified
	 * {@link ContestController} true.
	 *  
	 * @param contestController the ContestController which this ScoreboardChangeListener will update on detecting potential-scoreboard-changing 
	 * events.  
	 */	
	public ScoreboardUpdates(maincontroller contestcontroller) {
		super();
		this.contestcontroller = contestcontroller;
	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since
	 * adding a configuration item (for example, a new team account) potentially changes the standings.
	 */
	@Override
	public void configurationItemAdded(ContestEvent arg0) {
		InvalidateCache();

	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since
	 * removing a configuration item (for example, a team account) potentially changes the standings.
	 */
	@Override
	public void configurationItemRemoved(ContestEvent arg0) {
		InvalidateCache();

	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since
	 * updating a configuration item (for example, changing the "display on scoreboard" property of
	 * a team acount) potentially changes the standings.
	 */
	@Override
	public void configurationItemUpdated(ContestEvent arg0) {
		InvalidateCache();

	}

	/**
	 * This method does nothing, since checking out a run (to judge it) has no effect on standings.
	 */
	@Override
	public void runCheckedOut(IRun arg0, boolean arg1) {
		// TODO Auto-generated method stub

	}

	/**
	 * This method does nothing, since compiling a run has no effect on standings.
	 */
	@Override
	public void runCompiling(IRun arg0, boolean arg1) {
		// TODO Auto-generated method stub

	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since a
	 * deleted run potentially changes the standings.
	 */
	@Override
	public void runDeleted(IRun arg0) {
		InvalidateCache();

	}

	/**
	 * This method does nothing, since executing a run has no effect on standings.
	 */
	@Override
	public void runExecuting(IRun arg0, boolean arg1) {
		// TODO Auto-generated method stub

	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since a
	 * judged run potentially changes the standings.
	 */
	@Override
	public void runJudged(IRun arg0, boolean arg1) {
		InvalidateCache();

	}

	/**
	 * This method does nothing, since cancelling the judging of a run has no effect on standings.
	 */
	@Override
	public void runJudgingCanceled(IRun arg0, boolean arg1) {
		// TODO Auto-generated method stub

	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since a
	 * submitted run potentially changes the standings (in terms of "pending runs" count,
	 * which some standings displays may utilize).
	 */
	@Override
	public void runSubmitted(IRun arg0) {
		InvalidateCache();

	}

	/**
	 * Sets the contest controller's "scoreboardCacheInvalidate" flag true, since an
	 * updated run potentially changes the standingst
	 */
	@Override
	public void runUpdated(IRun arg0, boolean arg1) {
		InvalidateCache();

	}

	/**
	 * This method does nothing, since validating a run has no effect on standings.
	 */
	@Override
	public void runValidating(IRun arg0, boolean arg1) {
		// TODO Auto-generated method stub

	}
	
	private void InvalidateCache() {
		contestcontroller.setCacheInvalidationFlag(true);
		
		JsonObject builder =  Json.createObjectBuilder()
				.add("type", WebsocketMsgType.STANDINGS.name().toLowerCase())
				.add("id", "1-1") //id value was: String.format("%s-%s", arg0.getSiteNumber(), arg0.getNumber())), but id is basically useless here...
				.build();
		
		ContestSocket.broadcast(builder.toString());
		
	}
	
	
	

}
