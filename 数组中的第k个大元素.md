## [数组中的第k个大元素](#数组中的第k个大元素)

给定整数数组 `nums` 和整数 `k`，请返回数组中第 `k` 个最大的元素。

请注意，你需要找的是数组排序后的第 `k` 个最大的元素，而不是第 `k` 个不同的元素。

### 解法一：排序法（O(n log n)）

```C++
class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        sort(nums.begin(), nums.end());
        return nums[nums.size() - k];
    }
};
```

### 解法二：小根堆法（O(n log k)）

**思路**：维护一个大小为 `k` 的小根堆，堆顶就是第 K 大的元素。

```C++
class Solution {
public:
    int findKthLargest(vector<int>& nums, int k) {
        priority_queue<int, vector<int>, greater<int>> pq; // 小根堆
        for (int x : nums) {
            pq.push(x);
            if (pq.size() > k) {
                pq.pop();
            }
        }
        return pq.top();
    }
};
```

**为什么用小根堆？** 我们要保留最大的 k 个数，堆顶是这 k 个数中最小的 → 那就是第 K 大。

---
