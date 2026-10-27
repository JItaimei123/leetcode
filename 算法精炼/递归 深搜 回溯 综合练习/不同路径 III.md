在二维网格 `grid` 上，有 4 种类型的方格：

- `1` 表示起始方格。且只有一个起始方格。

- `2` 表示结束方格，且只有一个结束方格。

- `0` 表示我们可以走过的空方格。

- `-1` 表示我们无法跨越的障碍。

返回在四个方向（上、下、左、右）上行走时，从起始方格到结束方格的不同路径的数目。

每一个无障碍方格都要通过一次，但是一条路径中不能重复通过同一个方格。

示例 1：

```C++
输入：[[1,0,0,0],[0,0,0,0],[0,0,2,-1]]
输出：2
解释：我们有以下两条路径：
1. (0,0),(0,1),(0,2),(0,3),(1,3),(1,2),(1,1),(1,0),(2,0),(2,1),(2,2)
2. (0,0),(1,0),(2,0),(2,1),(1,1),(0,1),(0,2),(0,3),(1,3),(1,2),(2,2)
```

```C++
class Solution
{
    int dir[4][2] = {{-1,0},{1,0},{0,-1},{0,1}};
    bool vis[21][21] = {false};
    int ans = 0;//合法路线
    int totalsteps = 0;//经过0的次数
    int m,n;
public:
    int uniquePathsIII(vector<vector<int>>& grid)
    {
        m = grid.size();
        n = grid[0].size();
        int startx = 0,starty = 0;
        for(int i = 0;i<m;i++)
        {
            for(int j = 0;j<n;j++)
            {
                //统计一共有多少个0
                if(grid[i][j] == 0) totalsteps++;
                //得出起点坐标
                if(grid[i][j] == 1)
                {
                    startx = i;
                    starty = j;
                }
            }
        }
        dfs(grid,startx,starty,0);
        return ans;
    }
    void dfs(vector<vector<int>>& grid,int i,int j,int step)
    {
        //考虑边界 障碍 已占用的情况
        if(i < 0 || i >= m || j < 0 || j >= n || grid[i][j] == -1 || vis[i][j]) return;
        //递归出口:当走到2的时候就结束，判断一下是否符合条件
        if(grid[i][j] == 2)
        {
            if(step == totalsteps)
            {
                ans++;
                return;
            }
        }
        //标记占用
        vis[i][j] = true;
        //从四个方向深搜
        for(int k = 0;k<4;k++)
        {
            int x = i + dir[k][0];
            int y = j + dir[k][1];
            //如果递归到的下一个位置是0，那就传step+1，不然就传step然后终止
            int nextstep = grid[i][j] == 0 ? step+1 : step;
            dfs(grid,x,y,nextstep);
        }
        vis[i][j] = false;
    }
};
```
