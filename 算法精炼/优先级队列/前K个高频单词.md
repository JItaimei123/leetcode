给定一个单词列表 `words` 和一个整数 `k`，返回前 `k` 个出现次数最多的单词。

返回的答案应该按单词出现频率由高到低排序。如果不同的单词有相同出现频率， 按字典顺序 排序。

示例 1：

```C++
输入: words = ["i", "love", "leetcode", "i", "love", "coding"], k = 2
输出: ["i", "love"]
解析: "i" 和 "love" 为出现次数最多的两个单词，均为2次。
    注意，按字母顺序 "i" 在 "love" 之前。
```

```C++
class Solution {
public:
    vector<string> topKFrequent(vector<string>& words, int k)
    {
        //将字符串出现的频率统计
        unordered_map<string,int> hash;
        for(auto x : words)
        hash[x]++;
        //要同时进行两种比较，所以我们自定义比较规则
        auto cmp = [](const pair<int,string>& a,const pair<int,string>& b)
        {
            //如果频率相同那就比较字符串大小,频率高的在前 字典顺序小的在前，所以这里符号是相反的
            if(a.first == b.first)
            //返回true的话就说明a的优先级小于b的，a沉底，b在顶->字典小的沉底，从最后开始打印
            return a.second < b.second;
          //频率大的沉底
            return a.first > b.first;
        };
        //建立小根堆 用自定义比较
        priority_queue<pair<int,string>,vector<pair<int,string>>,decltype(cmp)> heap(cmp);
        //将哈希表的数据入堆，并保持只有k个数
        for(auto y : hash)
        {
            string word = y.first;
            int freq = y.second;
            heap.push({freq,word});
            if(heap.size() > k) heap.pop();
        }
        //持续提取堆顶元素，最后再反转，把最"大"(频率最高+字典顺序最小)的元素放在前面
        vector<string> ret;
         while(!heap.empty())
        {
            ret.push_back(heap.top().second);
            heap.pop();
        }
        reverse(ret.begin(),ret.end());
        return ret;
    }
};
```
