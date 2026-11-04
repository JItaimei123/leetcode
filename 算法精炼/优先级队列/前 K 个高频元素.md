给你一个整数数组 `nums` 和一个整数 `k`，请你返回其中出现频率前 `k` 高的元素。你可以按 任意顺序 返回答案。

示例 1：

输入：nums = [1,1,1,2,2,3], k = 2

输出：[1,2]

## 思路

用哈希表统计数字的出现频率，以pair的形式打包入堆，pair在堆中的比较一般优先比较第一个，所以以`{freq,num}`的形式入堆，最后再把前k个高频的元素从堆中的`pair`中提取出来(.second)

```C++
class Solution {
public:
    vector<int> topKFrequent(vector<int>& nums, int k)
    {
        //用哈希表统计数字出现的频率-> <数字，频率>
        unordered_map<int,int> hash;
        for(auto num1 : nums)
        hash[num1]++;
        //创立小根堆比较频率，优先比较pair的第一个，所以这里的<int,int>应该是<频率，数字>
        priority_queue<pair<int,int>,vector<pair<int,int>>,greater<pair<int,int>>> heap;
        //遍历哈希表 把数据入堆
        for(auto x : hash)
        {
            int num2 = x.first;
            int freq = x.second;
            heap.push({freq,num2});
            if(heap.size()>k) heap.pop();
        }
        vector<int> ret;
        //把堆里的pair的num部分拆出来
        while(heap.size())
        {
            ret.push_back(heap.top().second);
            heap.pop();
        }
        return ret;
    }
};
```
