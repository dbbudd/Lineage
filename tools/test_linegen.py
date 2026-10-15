"""Focused checks for the optional fast portrait routing mode."""
import unittest
import numpy as np
from skimage.graph import MCP_Geometric
from linegen import route_strokes


class RoutingTests(unittest.TestCase):
    def test_fast_search_preserves_minimum_cost(self):
        rng = np.random.default_rng(41)
        for _ in range(12):
            cost = rng.uniform(1, 8, (24, 24))
            ends = [tuple(p) for p in rng.integers(0, 24, (10, 2))]
            start = [tuple(rng.integers(0, 24, 2))]
            full, _ = MCP_Geometric(cost).find_costs(start)
            fast, _ = MCP_Geometric(cost).find_costs(start, ends=ends, find_all_ends=False)
            self.assertAlmostEqual(min(full[e] for e in ends), min(fast[e] for e in ends))

    def test_legacy_default_is_unchanged(self):
        strokes = [np.array([[4., 4.], [4., 16.]]), np.array([[16., 4.], [16., 16.]])]
        args = dict(shape=(24, 24), W=np.zeros((24, 24)), start=np.array([0., 23.]))
        np.testing.assert_array_equal(route_strokes(strokes, **args), route_strokes(strokes, nearest_only=False, **args))

    def test_fast_route_visits_strokes_and_finishes_at_crown(self):
        strokes = [np.array([[4., 4.], [4., 16.]]), np.array([[16., 4.], [16., 16.]])]
        final = np.array([[11., 5.], [11., 1.]])
        route = route_strokes(strokes, shape=(24, 24), W=np.zeros((24, 24)),
                              start=np.array([0., 23.]), final=final, nearest_only=True, skip_ratio=60)
        for stroke in strokes:
            for endpoint in stroke:
                self.assertTrue(np.any(np.all(route == endpoint, axis=1)))
        np.testing.assert_array_equal(route[-1], final[-1])


if __name__ == '__main__':
    unittest.main()
