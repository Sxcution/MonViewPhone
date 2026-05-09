# MonKeyboard Project Structure

This project is an Android Input Method Editor (IME) that provides a lightweight, "invisible" keyboard interface.

## Project Layout
- `app/build.gradle`: App-level Gradle configuration.
- `app/src/main/AndroidManifest.xml`: App manifest declaring the IME service.
- `app/src/main/java/com/monkeyboard/ime/`: Java source code.
  - `MainActivity.java`: Setup guide activity.
  - `MonKeyboardService.java`: Core IME service logic.
- `app/src/main/res/`: Resource files.
  - `layout/activity_main.xml`: UI for the setup activity.
  - `layout/keyboard_view.xml`: UI for the keyboard itself.
  - `values/strings.xml`: Localized strings.
  - `values/themes.xml`: App theme definitions.
  - `xml/method.xml`: IME subtype configuration.
- `naming_registry.json`: Registry of IDs and variable names.
- `project_structure.md`: This file.
