# Telegraph_downloader
> node-fetch  
> cheerio  
> nodejs   
* A simple downloader for Telegraph

# Use
1. `git clone`
2. `npm i`
3. create & modify `task.txt`, just put your url links in it
4. `npm start`

# Know issues
1. ~~Image maybe broken under high concurrency~~ (fixed)
> Some ways: async.queue async.mapLimit   

# config.json

| key | Description | default |
| :-: |:-: | :-:| 
| downloadDir | Images download dir| `./tmp`| 
| limit | Concurrency Limit| `10`| 
| proxy | Http proxy| `null`| 
| links | A file which store download Links| `task.txt`| 
| linksOnly | while true, print all image's links and exit without download anything| `false`| 
