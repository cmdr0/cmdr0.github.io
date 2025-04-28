def main(infile_name):
    with open(infile_name) as infile:
        for line in infile:
            line = line.strip()
            if not line.startswith('#'): continue
            title = line
            title = title.replace('### ','    - [')
            title = title.replace('## ','  - [')
            title = title.replace('# ','- [')
            url = line
            url = url.lower()
            url = url.replace('### ','')
            url = url.replace('## ','')
            url = url.replace('# ','')
            url = url.replace(' ','-')
            url = url.replace('.','')
            url = url.replace(',','')
            url = url.replace('`','')
            url = url.replace('/','')
            url = url.replace('(','')
            url = url.replace(')','')
            url = url.replace(':','')
            print(f'{title}](#{url})')



if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('--infile', '-i', required=True)
    args = parser.parse_args()

    main(args.infile)