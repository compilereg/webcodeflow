/*
 * his extends ValidationResult.

Its job is:

hold validation errors and
hold the resolved objects needed by submit run

That means:

IProblem problem
ILanguage language
Why you need it

Because after validation succeeds, your API still needs the real PC2 objects to submit
 */



package utilities;

import edu.csus.ecs.pc2.api.ILanguage;
import edu.csus.ecs.pc2.api.IProblem;

public class SubmitRunValidationResult extends ValidationResult {

    private IProblem problem;
    private ILanguage language;

    public IProblem getProblem() {
        return problem;
    }

    public void setProblem(IProblem problem) {
        this.problem = problem;
    }

    public ILanguage getLanguage() {
        return language;
    }

    public void setLanguage(ILanguage language) {
        this.language = language;
    }
}