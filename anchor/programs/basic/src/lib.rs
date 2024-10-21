use anchor_lang::prelude::*;

declare_id!("DY52aoULZMuua7QNA2ezDrrusCGhHrEq1H6tLn2by4G6");

pub const ANCHOR_DISCRIMINATOR_SIZE: usize = 8;

#[program]
pub mod basic {
    use super::*;

    pub fn create_journal_entry(
        ctx: Context<CreateEntry>,
        title: String,
        message: String,
    ) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry; // this returns a mutable reference to the journal_entry account
        journal_entry.owner = *ctx.accounts.owner.key; // this probably returns a reference to the public key so need to dereference it using *
        journal_entry.title = title;
        journal_entry.message = message;

        Ok(())
    }

    // The title is not directly used inside the function body of update_journal_entry, but it is crucial for account validation. It’s used in the seeds attribute to ensure that the correct journal entry is being accessed or modified.
    pub fn update_journal_entry(
        ctx: Context<UpdateEntry>,
        _title: String,
        message: String,
    ) -> Result<()> {
        let journal_entry = &mut ctx.accounts.journal_entry;
        journal_entry.message = message;

        Ok(())
    }

    pub fn delete_journal_entry(_ctx: Context<DeleteEntry>, _title: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        init,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        space = ANCHOR_DISCRIMINATOR_SIZE + JournalEntryState::INIT_SPACE,
        payer = owner,
    )]
    pub journal_entry: Account<'info, JournalEntryState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut, // IMPORTANT: since we're updating stuff, remember to add this
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        // there are few more things we need to do here
        realloc = ANCHOR_DISCRIMINATOR_SIZE + JournalEntryState::INIT_SPACE, // we need to re calculate the size of the journal entry once its updated and then reallocate the space (either more or less)
        realloc::payer = owner, // now either the user may recieve some extra lamports back due to reducing the content but they also might need to pay for the extra space they're taking now
        realloc::zero = true, // this ensures that any newly allocated space (when the size increases) is zeroed out, this helps prevent any uninitialized or leftover data from previous uses of the memory. It is a security measure to ensure that no sensitive information is accidentally exposed.
    )]
    pub journal_entry: Account<'info, JournalEntryState>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteEntry<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,

    #[account(
        mut,
        seeds = [title.as_bytes(), owner.key().as_ref()],
        bump,
        close = owner, // this makes sure that only the owner can close the account
    )]
    pub journal_entry: Account<'info, JournalEntryState>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct JournalEntryState {
    pub owner: Pubkey,

    #[max_len(50)]
    pub title: String,

    #[max_len(1000)]
    pub message: String,
}