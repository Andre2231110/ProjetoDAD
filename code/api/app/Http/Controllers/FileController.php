<?php

namespace App\Http\Controllers;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class FileController extends Controller {
    public function uploadUserPhoto(Request $request) {
        $request->validate(['photo' => 'required|image|max:2048']); 
        
        $path = $request->file('photo')->store('public/photos'); 
        $url = Storage::url($path); 

        return response()->json(['photo_url' => $url], 200);
    }
}
