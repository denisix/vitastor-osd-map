# vitastor-osd-map
vitastor-osd-map is a CLI tool to list all OSDs and related block devices, brief overall information about vitastor cluster

### Usage
please review the source code and install it:
```bash
wget https://github.com/denisix/vitastor-osd-map/raw/main/osd-map.js -O /usr/local/bin/osd-map && \
chmod +x /usr/local/bin/osd-map
```

then it will be available to run on any vitastor node, just issue
```bash
osd-map
```

### Example output:

```bash
root@cb1:~# osd-map
  OSD            GB              Block           Tag             Addresses       Ping            UP              Local
+ node cb1
  1              1.04%  4 TB     128k            ssd             10.100.7.31     220.14          up              sda4 +jrnl[nvme0n1p1] +meta[nvme0n1p2]
  2              1.03%  4 TB     128k            ssd             10.100.7.31     152.28          up              sdb1 +jrnl[nvme0n1p3] +meta[nvme0n1p4]
  3              36.21% 18 TB    1024k           hdd             10.100.7.31     142.13          up              sdc1 +jrnl[nvme0n1p5] +meta[nvme0n1p6]
  4              36.17% 18 TB    1024k           hdd             10.100.7.31     184.09          up              sdd1 +jrnl[nvme0n1p7] +meta[nvme0n1p8]
+ node cb2
  5              1.04%  4 TB     128k            ssd             10.100.7.32     92.72           up
  6              1.04%  4 TB     128k            ssd             10.100.7.32     147.46          up
  7              36.17% 18 TB    1024k           hdd             10.100.7.32     58.92           up
  8              36.21% 18 TB    1024k           hdd             10.100.7.32     194.81          up
+ node cb3
  9              1.04%  4 TB     128k            ssd             10.100.7.33     14.04           up
  10             1.04%  4 TB     128k            ssd             10.100.7.33     16.76           up
```

please feel free to implement any new features, waiting for your pull requests :)

> P.S.: Please give [this repo](https://github.com/denisix/wireguard) a star if you like it :wink:
