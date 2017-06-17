# Part of Engineering Toolkit for LightningChat
# REQUIRES: Python3, lessc, slimit, UNIX based OS (fk windows).
# Copyright Jun Zheng, Author Jun Zheng

import os
from subprocess import call
from slimit import minify

compiled_dir = "compiled"
less_file = "style.less"
sdk_file = "sdk.js"
ui_script_file = "ui.js"
ui_html_file = "ui.html"
ui_config_file = "ui-config.js"
loader_script_file = "lightningchat.js"

def compile_js(in_path, out_path):
    compiled_file = ""
    try:
        with open(in_path, 'r') as f:
            data = f.read()
            splitted_data = data.split('\n')
            for i in range(len(splitted_data)):
                try:
                    if splitted_data[i].split("!!@!!")[1] == "DELETEONCOMPILE":
                        splitted_data[i] = ""
                    elif splitted_data[i].split("!!@!!")[1] == "UNCOMMENTONCOMPILE":
                        splitted_data[i] = splitted_data[i][2:]
                except IndexError:
                    pass
            data = ""
            for line in splitted_data:
                data += line + "\n"
            compiled_file = minify(data, mangle=False, mangle_toplevel=True)
    except Exception as e:
        print(e)
        print("Failed to read file " + in_path)
        exit()
    try:
        with open(out_path, "w") as f:
            f.write(compiled_file)
    except Exception:
        print("Failed to write file " + out_path)
        exit()

def compile_js_no_write(in_path):
    compiled_file = ""
    try:
        with open(in_path, 'r') as f:
            data = f.read()
            splitted_data = data.split('\n')
            for i in range(len(splitted_data)):
                try:
                    if splitted_data[i].split("!!@!!")[1] == "DELETEONCOMPILE":
                        splitted_data[i] = ""
                    elif splitted_data[i].split("!!@!!")[1] == "UNCOMMENTONCOMPILE":
                        splitted_data[i] = splitted_data[i][2:]
                except IndexError:
                    pass
            data = ""
            for line in splitted_data:
                data += line + "\n"
            compiled_file = minify(data, mangle=False, mangle_toplevel=True)
    except Exception as e:
        print(e)
        print("Failed to read file " + in_path)
        exit()
    return compiled_file

def read_file(file_path):
    with open(file_path, 'r') as f:
        return f.read()

if __name__ == "__main__":
    # Check if output directory exists
    if not os.path.isdir(compiled_dir):
        os.makedirs(compiled_dir)
    if compiled_dir[-1] == "/":
        compiled_dir = compiled_dir[:-1]
    # Compile less style sheet
    call(["lessc", "--clean-css", less_file, compiled_dir + "/style.css"])
    print("**SUCCESS** Less compiled")
    # Compile javascript sdk
    compiled_sdk_file = compile_js_no_write(sdk_file)
    print("**SUCCESS** JavaScript SDK compiled")
    # Compile loader script
    compiled_loader_script_file = compile_js_no_write(loader_script_file)
    print("**SUCCESS** Loader script compiled")
    # Compile UI script
    compiled_ui_script_file = compile_js_no_write(ui_script_file)
    print("**SUCCESS** UI script compiled")

    try:
        with open(compiled_dir + "/lc.min.js", "w") as f:
            f.write(compiled_sdk_file + "\n" + read_file(ui_config_file) + "\n" + compiled_loader_script_file + "\n" + compiled_ui_script_file);
    except Exception:
        print("Failed to write file " + out_path)
        exit()

    # Compile UI html, tbh, just copy the file over
    call(["cp", "ui.html", compiled_dir + "/ui.html"])
    print("**SUCCESS** UI html compiled")

    print("**SUCCESS** ⚡ DONE! ⚡")