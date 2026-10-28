import { useState } from "react";
import { updateProject } from "../api/projectsApi";
import { useSubmit } from "./useSubmit";
import { validateProjectName } from "../utils/validation";
import { PROJECT_ERROR_MESSAGES } from "../constants/projects";

// backend field messages are lowercase ("must not be blank"); start them with a capital letter
const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

/**
 * Editing a project's name and description (PATCH /projects/{id}, EDIT_SETTINGS), shared by
 * EditProjectDialog and the Settings tab. `onSaved(project)` runs after a successful save.
 * const form = useProjectForm(project, onSaved); <form onSubmit={form.save}>
 */
export const useProjectForm = (project, onSaved) => {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [nameError, setNameError] = useState("");
  const submit = useSubmit(PROJECT_ERROR_MESSAGES);

  const changeName = (value) => {
    setName(value);
    if (nameError) setNameError("");
  };

  const reset = () => {
    setName(project.name);
    setDescription(project.description ?? "");
    setNameError("");
    submit.clearError();
  };

  const save = async (e) => {
    e?.preventDefault();
    const error = validateProjectName(name);
    setNameError(error);
    if (error) return;

    // an empty description clears it
    const body = { name: name.trim(), description: description.trim() };
    const { ok, result, error: apiError } = await submit.run(() => updateProject(project.id, body));
    if (ok) {
      onSaved(result);
      return;
    }
    const data = apiError.response?.data;
    if (data?.code === "VALIDATION_ERROR" && data.fieldErrors?.name) {
      setNameError(capitalize(data.fieldErrors.name));
      submit.clearError();
    }
  };

  // compared the way they are sent, so whitespace alone isn't a change
  const dirty = name.trim() !== project.name || description.trim() !== (project.description ?? "");

  return {
    name,
    description,
    nameError,
    changeName,
    setDescription,
    save,
    reset,
    dirty,
    submitting: submit.submitting,
    error: submit.error,
  };
};
