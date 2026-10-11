package feature

import (
	"slices"
	"testing"
)

func TestSet(t *testing.T) {
	set := NewSet(PlayerSetInvisible, PlayerKick, PlayerKick)
	set.Add(PlayerSetGodMode)

	want := []ID{PlayerKick, PlayerSetGodMode, PlayerSetInvisible}
	slices.Sort(want)
	if got := set.Values(); !slices.Equal(got, want) {
		t.Errorf("set values = %v, want unique sorted values %v", got, want)
	}
	if !set.Has(PlayerKick) || set.Has(PlayerBan) {
		t.Errorf("set membership = %v, want kick present and ban absent", set)
	}

	values := set.Values()
	values[0] = PlayerBan
	if set.Has(PlayerBan) {
		t.Errorf("mutating Values() changed set: %v", set)
	}
}
