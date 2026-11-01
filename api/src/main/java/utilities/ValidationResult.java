/*
 * This is the base class.
 * Its job is only to store validation errors.
 * collects error messages
tells you whether there are errors
returns the errors list


 * Why it exists

Because many validators may need the same behavior:

submit run validator
submit clarification validator
login validator
file validator
 */






package utilities;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class ValidationResult {

    private final List<String> errors = new ArrayList<>();

    public void addError(String error) {
        if (error != null && !error.trim().isEmpty()) {
            errors.add(error);
        }
    }

    public boolean hasErrors() {
        return !errors.isEmpty();
    }

    public List<String> getErrors() {
        return Collections.unmodifiableList(errors);
    }
}