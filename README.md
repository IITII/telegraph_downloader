# Telegraph_downloader
> nodejs  
> cheerio  
> request-promise 
* A simple downloader for Telegraph

# Use
1. `git clone`
2. `npm i`
3. create & modify `task.txt`, just put your url links in it
4. `npm start`

# Know issues
1. ~~Image maybe broken under high concurrency~~ (fixed)
> Some ways: async.queue async.mapLimit   