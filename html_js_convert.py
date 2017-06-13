to_convert = '''
<link href="https://ssl.jackzh.com/file/css/font-awesome-4.4.0/css/font-awesome.min.css" rel="stylesheet" type="text/css" />
'''
to_convert = to_convert.replace("\n", "");
to_convert = to_convert.replace('"', '\\"');
print(to_convert)
