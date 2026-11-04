设计一个找到数据流中第 `k` 大元素的类（class）。注意是排序后的第 `k` 大元素，不是第 `k` 个不同的元素。

请实现 `KthLargest` 类：

- `KthLargest(int k, int[] nums)` 使用整数 `k` 和整数流 `nums` 初始化对象。

- `int add(int val)` 将 `val` 插入数据流 `nums` 后，返回当前数据流中第 `k` 大的元素。

示例 1：

输入：
["KthLargest", "add", "add", "add", "add", "add"]
[[3, [4, 5, 8, 2]], [3], [5], [10], [9], [4]]

输出：[null, 4, 5, 5, 8, 8]

## 思路：

找第k大建小根堆，当堆内元素大于k的时候将堆顶元素弹出，直到遍历完成，这样堆顶元素就是第k大了

```C++
class KthLargest {
    priority_queue<int,vector<int>,greater<int>> minheap;
    int K;
public:
    KthLargest(int k, vector<int>& nums)
    {
        K = k;
        //将初始数据入堆
        for(auto x : nums)
        {
            minheap.push(x);
            if(minheap.size() > K) minheap.pop();
        }
    }

    int add(int val)
    {
        //新数据入堆
        minheap.push(val);
        //如果个数大于k就弹出堆顶元素
        if(minheap.size()>K)
        minheap.pop();
        return minheap.top();
    }
};

```
