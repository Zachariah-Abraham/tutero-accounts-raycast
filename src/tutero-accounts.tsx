import { Action, ActionPanel, Form, Icon, List, LocalStorage, showToast, Toast } from "@raycast/api";
import { useEffect, useState } from "react";
import {
  autofillPopup,
  copyLastSignedUpEmail,
  getAllAccounts,
  nameLocalStorageKey,
  PopupType,
  UserType,
} from "./utils";

type StoredValue = string | number | boolean;

export default function Command() {
  return (
    <List>
      <List.Section title="Sign Up">
        <List.Item
          title="Sign up as Teacher"
          actions={
            <ActionPanel>
              <Action
                title="Sign up as Teacher"
                onAction={() => autofillPopup(PopupType.SignUp, UserType.Teacher, undefined)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Sign up as Student"
          actions={
            <ActionPanel>
              <Action
                title="Sign up as Student"
                onAction={() => autofillPopup(PopupType.SignUp, UserType.Student, undefined)}
              />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Log In">
        <List.Item
          title="Log in as Teacher"
          actions={
            <ActionPanel>
              <Action
                title="Log in as Teacher"
                onAction={() => autofillPopup(PopupType.LogIn, UserType.Teacher, undefined)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Log in as Student"
          actions={
            <ActionPanel>
              <Action
                title="Log in as Student"
                onAction={() => autofillPopup(PopupType.LogIn, UserType.Student, undefined)}
              />
            </ActionPanel>
          }
        />
        <List.Item
          title="Log in with..."
          actions={
            <ActionPanel>
              <Action.Push title="Log in with..." target={<ListOfTuteroAccounts />} />
            </ActionPanel>
          }
        />
      </List.Section>

      <List.Section title="Misc">
        <List.Item
          title="Get Last Used Email"
          actions={
            <ActionPanel>
              <Action title="Get Last Used Email as Teacher" onAction={() => copyLastSignedUpEmail(UserType.Teacher)} />
              <Action title="Get Last Used Email as Student" onAction={() => copyLastSignedUpEmail(UserType.Student)} />
            </ActionPanel>
          }
        />
        <List.Item
          title="Manage"
          actions={
            <ActionPanel>
              <Action.Push icon={Icon.Pencil} title="Manage Preferences" target={<ManageForm />} />
            </ActionPanel>
          }
        />
      </List.Section>
    </List>
  );
}

export function ListOfTuteroAccounts() {
  const [state, setState] = useState([] as string[]);

  useEffect(() => {
    const allAccounts: string[] = [];
    getAllAccounts(UserType.Teacher).then((teacherAccounts) => {
      allAccounts.push(...teacherAccounts);
      setState(allAccounts);
    });
    getAllAccounts(UserType.Student).then((studentAccounts) => {
      allAccounts.push(...studentAccounts);
      setState(allAccounts);
    });
  }, []);

  return (
    <List>
      {state.map((item) => (
        <List.Item
          key={item}
          title={item}
          actions={
            <ActionPanel>
              <Action title="Select" onAction={() => autofillPopup(PopupType.LogIn, UserType.Student, item)} />
            </ActionPanel>
          }
        />
      ))}
    </List>
  );
}

export function ManageForm() {
  const [storedItems, setStoredItems] = useState([] as [string, StoredValue][]);

  useEffect(() => {
    LocalStorage.allItems<[string, StoredValue]>().then((items) => {
      setStoredItems(Object.entries(items));
    });
  }, []);

  return (
    <Form
      actions={
        <ActionPanel>
          <SavePreferencesAction />
          <ClearPreferencesAction />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Name"
        text={`This is the name used at the start of your accounts. Use ⌘ + ⏎ to save the name. Hit Esc to leave the name unchanged.`}
      />
      <Form.TextArea id="name" title="Value" placeholder="e.g. zac" />
      <Form.Separator />
      <Form.Description
        title="Preferences"
        text={`This is a list of all stored preferences.\n\nUse ⌘ + k to open the action menu to clear all values.\n${storedItems
          .filter((e) => !e[0].includes("accounts"))
          .map((item) => item[0] + ": " + item[1])
          .join("\n")}`}
      />
    </Form>
  );
}

function SavePreferencesAction() {
  async function handleSubmit(values: { name: string }) {
    const name = values.name;

    // name shouldn't be empty
    if (!name) {
      showToast({
        style: Toast.Style.Failure,
        title: "Name is required",
      });
      return;
    }

    // name should contain only letters
    if (!/^[a-zA-Z]+$/.test(name)) {
      showToast({
        style: Toast.Style.Failure,
        title: "Invalid name",
        message: "Name should contain only letters",
      });
      return;
    }

    const toast = await showToast({
      style: Toast.Style.Animated,
      title: "Saving name",
    });

    try {
      await LocalStorage.setItem(nameLocalStorageKey(), name.toLowerCase());
      toast.style = Toast.Style.Success;
      toast.title = "Saved name";
      toast.message = "Set name in preferences";
    } catch (error) {
      toast.style = Toast.Style.Failure;
      toast.title = "Failed saving name";
      toast.message = String(error);
    }
  }

  return <Action.SubmitForm icon={Icon.Upload} title="Save Name" onSubmit={handleSubmit} />;
}

function ClearPreferencesAction() {
  return <Action.SubmitForm icon={Icon.Eraser} title="Clear All Preferences" onSubmit={() => LocalStorage.clear()} />;
}
