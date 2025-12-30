<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class UserPolicy
{
    use HandlesAuthorization;

    /**
     * Verifica se o usuário é admin
     */
    public function isAdmin(User $user)
    {
        return $user->type === 'A';
    }
}
