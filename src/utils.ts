import { Clipboard, LocalStorage, Toast, getFrontmostApplication, showToast } from "@raycast/api";
import { runAppleScript } from "run-applescript";

export enum UserType {
  Teacher = "teach",
  Student = "stud",
}

export enum PopupType {
  LogIn = "log-in",
  SignUp = "sign-up",
}

export interface Sequence {
  name: string;
  description: string;
  icon: string;
  shortcut: Shortcut;
}

export interface Shortcut {
  keystrokes: string;
  modifiers: string[];
}

export const copyLastSignedUpEmail = async (userType: UserType) => {
  const name = await LocalStorage.getItem<string>(nameLocalStorageKey());
  if (!name) {
    await showToast(Toast.Style.Failure, "Use 'Manage' first to set your name");
    return;
  }
  const lastEmail = await getLastSignedUpEmail(userType);
  if (!lastEmail) {
    await showToast(Toast.Style.Failure, "Couldn't find any signed up email for " + name + " " + userType);
    return;
  }
  await Clipboard.copy(lastEmail);
  await showToast(Toast.Style.Success, "Copied " + lastEmail + " to clipboard");
};

export const autofillPopup = async (popupType: PopupType, userType: UserType, email: string | undefined) => {
  const tabSequence = "ASCII character 9";
  const enterSequence = "ASCII character 13";

  // get name
  const name = await LocalStorage.getItem<string>(nameLocalStorageKey());
  if (!name) {
    await showToast(Toast.Style.Failure, "Use 'Manage' first to set your name");
    return;
  }

  if (popupType === PopupType.LogIn) {
    // login flow
    const lastEmail = email ?? (await getLastSignedUpEmail(userType));
    if (!lastEmail) {
      await showToast(Toast.Style.Failure, "Couldn't find any signed up email for " + name + " " + userType);
      return;
    }
    await Clipboard.paste(lastEmail);
    await runShortcutSequence(tabSequence);
    await Clipboard.paste("123123");
    await runShortcutSequence(enterSequence);
  } else {
    // signup flow
    // get last stored date (stored in month-day format)
    const lastDate = await LocalStorage.getItem<string>(dateLocalStorageKey());
    const today = new Date();
    const month = today.toLocaleDateString("en-US", { month: "short" }).toLowerCase();
    const day = today.getDate();
    const year = today.getFullYear();
    const storeDate = month + day;

    // if this is the first time we're storing, or last stored date is not today, reset the account number
    if (!lastDate || lastDate !== storeDate) {
      await LocalStorage.setItem(accountNumberLocalStorageKey(name, userType), 0);
      await LocalStorage.setItem(dateLocalStorageKey(), storeDate);
    }

    // get account number
    let accountNumber = await LocalStorage.getItem<number>(accountNumberLocalStorageKey(name, userType));
    if (accountNumber == undefined) {
      accountNumber = 0;
    }
    accountNumber += 1;
    await LocalStorage.setItem(accountNumberLocalStorageKey(name, userType), accountNumber);

    const password = "123123";
    const accountName =
      titleCaseWord(name) + titleCaseWord(userType) + accountNumber + " " + titleCaseWord(month) + day + "." + year;
    const accountEmail =
      name.toLowerCase() + userType + accountNumber + "." + month + day + "." + year + "@yopmail.com";

    let accounts = await getAllAccounts(userType);
    await Clipboard.paste(accountName);
    await runShortcutSequence(tabSequence);
    await Clipboard.paste(accountEmail);
    await runShortcutSequence(tabSequence);
    await Clipboard.paste(password);
    await runShortcutSequence(tabSequence);
    await Clipboard.paste(password);
    await runShortcutSequence(enterSequence);
    await LocalStorage.setItem(accountsStorageKey(userType), [...accounts, accountEmail].join(","));
  }
  await showToast(Toast.Style.Success, "It's called ZacMagic™! :D");
};

export function nameLocalStorageKey() {
  return `name`;
}

export function accountNumberLocalStorageKey(name: string, userType: UserType) {
  return `${name}-${userType}-account-number`;
}

export function dateLocalStorageKey() {
  return `date`;
}

export function accountsStorageKey(userType: UserType) {
  return `${userType}-accounts`;
}

export async function getAllAccounts(userType: UserType): Promise<string[]> {
  const accountsString = await LocalStorage.getItem<string>(accountsStorageKey(userType));
  return accountsString ? accountsString.split(",") : [];
}

async function getLastSignedUpEmail(userType: UserType) {
  return (await getAllAccounts(userType)).slice(-1).pop();
}

function titleCaseWord(word: string) {
  if (!word) return word;
  return word[0].toUpperCase() + word.substr(1).toLowerCase();
}

export const runShortcutSequence = async (keystrokes: string) => {
  /* Runs each shortcut of a sequence in rapid succession. */
  const currentApplication = await getFrontmostApplication();
  const keystroke = (function getKeystroke() {
    if (keystrokes.includes("ASCII character")) {
      return `(${keystrokes})`;
    }
    if (keystrokes.includes("key code")) {
      return keystrokes;
    }
    return `"${keystrokes}"`;
  })();
  const script = `tell application "${currentApplication.name}"
          tell application "System Events"
              keystroke ${keystroke}
          end tell
      end tell`;
  await runAppleScript(script);
};
