<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    public function categories()
    {
        return $this->belongsToMany(Category::class);
    }

    public function comments()
    {
        return $this->hasMany(Comment::class);
    }

    public function tutorial()
    {
        return $this->hasOne(Tutorial::class);
    }
}
